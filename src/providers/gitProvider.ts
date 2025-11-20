import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { VcsProvider } from './vcsProvider';
import { ConfigManager } from '../configManager';

// Git版本控制系统提供者实现
export class GitProvider implements VcsProvider {
  private configManager: ConfigManager;
  private gitPath: string = 'git';
  private workspaceRoot: string = '';

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  // 初始化提供者
  public async initialize(): Promise<void> {
    this.gitPath = this.configManager.get<string>('git.path', 'git');
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }
    
    // 验证Git命令是否可用
    try {
      await this.executeCommand('--version');
    } catch (error) {
      vscode.window.showErrorMessage(`Git命令不可用: ${error}`);
    }
  }

  // 获取当前分支信息
  public async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.executeCommand('rev-parse', '--abbrev-ref', 'HEAD');
      return branch.trim();
    } catch (error) {
      console.error('获取Git分支信息失败:', error);
      return '';
    }
  }

  // 获取变更文件列表
  public async getChangedFiles(): Promise<string[]> {
    try {
      // 获取未暂存的变更
      const untrackedFiles = await this.executeCommand('ls-files', '--others', '--exclude-standard');
      const modifiedFiles = await this.executeCommand('diff', '--name-only');
      
      // 获取已暂存的变更
      const stagedFiles = await this.executeCommand('diff', '--staged', '--name-only');
      
      // 合并所有变更文件
      const allFiles = new Set<string>();
      
      untrackedFiles.split('\n')
        .filter(file => file.trim() !== '')
        .forEach(file => allFiles.add(file.trim()));
      
      modifiedFiles.split('\n')
        .filter(file => file.trim() !== '')
        .forEach(file => allFiles.add(file.trim()));
      
      stagedFiles.split('\n')
        .filter(file => file.trim() !== '')
        .forEach(file => allFiles.add(file.trim()));
      
      return Array.from(allFiles);
    } catch (error) {
      console.error('获取Git变更文件列表失败:', error);
      return [];
    }
  }

  // 执行提交操作
  public async commit(message: string, files?: string[]): Promise<boolean> {
    try {
      // 检查是否需要先拉取
      const autoPull = this.configManager.get<boolean>('git.autoPull', true);
      if (autoPull) {
        await this.update();
      }
      
      // 检查是否自动添加所有变更
      const addAll = this.configManager.get<boolean>('git.addAll', false);
      
      // 添加文件到暂存区
      if (files && files.length > 0) {
        await this.executeCommand('add', ...files);
      } else if (addAll) {
        await this.executeCommand('add', '--all');
      }
      
      // 执行提交命令
      const result = await this.executeCommand('commit', '-m', message);
      
      // 检查是否需要自动推送
      const autoPush = this.configManager.get<boolean>('git.autoPush', false);
      if (autoPush) {
        await this.executeCommand('push');
      }
      
      vscode.window.showInformationMessage('Git提交成功');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Git提交失败: ${error}`);
      return false;
    }
  }

  // 执行拉取操作
  public async update(): Promise<boolean> {
    try {
      const result = await this.executeCommand('pull');
      vscode.window.showInformationMessage('Git拉取成功');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Git拉取失败: ${error}`);
      return false;
    }
  }

  // 查看历史记录
  public async viewHistory(filePath?: string): Promise<void> {
    try {
      let args = ['log', '--pretty=format:%h %ad | %s%d [%an]', '--graph', '--date=short'];
      if (filePath) {
        args.push(filePath);
      }
      
      const log = await this.executeCommand(...args);
      
      // 创建输出通道显示日志
      const outputChannel = vscode.window.createOutputChannel('Git History');
      outputChannel.clear();
      outputChannel.append(log);
      outputChannel.show();
    } catch (error) {
      vscode.window.showErrorMessage(`获取Git历史记录失败: ${error}`);
    }
  }

  // 解决冲突
  public async resolveConflict(filePath: string, resolution: 'mine' | 'theirs' | 'manual'): Promise<boolean> {
    try {
      if (resolution === 'manual') {
        // 打开文件进行手动合并
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        return true;
      }
      
      // 使用Git命令解决冲突
      const option = resolution === 'mine' ? '--ours' : '--theirs';
      await this.executeCommand('checkout', option, '--', filePath);
      await this.executeCommand('add', filePath);
      
      vscode.window.showInformationMessage(`已解决文件 ${path.basename(filePath)} 的冲突`);
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`解决冲突失败: ${error}`);
      return false;
    }
  }

  // 检查是否有冲突
  public async hasConflicts(): Promise<boolean> {
    const conflictFiles = await this.getConflictFiles();
    return conflictFiles.length > 0;
  }

  // 获取冲突文件列表
  public async getConflictFiles(): Promise<string[]> {
    try {
      const status = await this.executeCommand('ls-files', '--unmerged');
      const conflictFiles = new Set<string>();
      
      // 解析输出，提取冲突文件
      const lines = status.split('\n');
      for (const line of lines) {
        if (line.trim() === '') {
          continue;
        }
        
        // 格式: <mode> <object> <stage> <file>
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const filePath = parts.slice(3).join(' '); // 文件名可能包含空格
          conflictFiles.add(filePath);
        }
      }
      
      return Array.from(conflictFiles);
    } catch (error) {
      console.error('获取Git冲突文件列表失败:', error);
      return [];
    }
  }

  // 获取文件diff信息
  public async getFileDiff(filePath: string): Promise<string> {
    try {
      // 判断是绝对路径还是相对路径
      let relativePath: string;
      if (path.isAbsolute(filePath)) {
        // 绝对路径，转换为相对路径
        relativePath = path.relative(this.workspaceRoot, filePath).replace(/\\/g, '/');
      } else {
        // 已经是相对路径
        relativePath = filePath.replace(/\\/g, '/');
      }
      
      // 尝试获取已暂存的diff
      let diff = '';
      try {
        diff = await this.executeCommand('diff', '--staged', '--', relativePath);
      } catch (error) {
        // 如果没有暂存的变更，获取工作区的diff
        try {
          diff = await this.executeCommand('diff', '--', relativePath);
        } catch (error2) {
          // 如果文件是新增的，尝试获取文件内容
          try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
            if (fs.existsSync(absolutePath)) {
              const content = fs.readFileSync(absolutePath, 'utf8');
              // 限制内容长度，避免超出token限制
              const maxContentLength = 2000;
              const truncatedContent = content.length > maxContentLength 
                ? content.substring(0, maxContentLength) + '\n... (内容已截断)'
                : content;
              diff = `新文件: ${relativePath}\n${truncatedContent}`;
            }
          } catch (error3) {
            // 忽略错误，返回空diff
          }
        }
      }
      
      return diff;
    } catch (error) {
      console.error(`获取文件 ${filePath} 的diff失败:`, error);
      return '';
    }
  }

  // 批量获取文件diff信息
  public async getFilesDiff(filePaths: string[]): Promise<Map<string, string>> {
    const diffs = new Map<string, string>();
    
    for (const filePath of filePaths) {
      const diff = await this.getFileDiff(filePath);
      if (diff) {
        diffs.set(filePath, diff);
      }
    }
    
    return diffs;
  }

  // 执行Git命令
  private executeCommand(...args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // 执行Git命令
      const process = cp.spawn(this.gitPath, args, { cwd: this.workspaceRoot });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(stderr || `命令执行失败，退出码: ${code}`);
        }
      });
      
      process.on('error', (err) => {
        reject(`命令执行错误: ${err.message}`);
      });
    });
  }
}