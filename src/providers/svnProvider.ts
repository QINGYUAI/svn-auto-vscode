import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { VcsProvider } from './vcsProvider';
import { ConfigManager } from '../configManager';

// SVN版本控制系统提供者实现
export class SvnProvider implements VcsProvider {
  private configManager: ConfigManager;
  private svnPath: string = 'svn';
  private workspaceRoot: string = '';

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  // 初始化提供者
  public async initialize(): Promise<void> {
    this.svnPath = this.configManager.get<string>('svn.path', 'svn');
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }
    
    // 验证SVN命令是否可用
    try {
      await this.executeCommand('--version');
    } catch (error) {
      vscode.window.showErrorMessage(`SVN命令不可用: ${error}`);
    }
  }

  // 获取当前分支/版本信息
  public async getCurrentBranch(): Promise<string> {
    try {
      const info = await this.executeCommand('info');
      const urlMatch = /URL:\s*(.+)/i.exec(info);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        // 从URL中提取分支信息
        const parts = url.split('/');
        const branchIndex = parts.findIndex(p => p === 'branches' || p === 'tags');
        if (branchIndex >= 0 && branchIndex < parts.length - 1) {
          return parts[branchIndex + 1];
        }
        return 'trunk';
      }
      return '';
    } catch (error) {
      console.error('获取SVN分支信息失败:', error);
      return '';
    }
  }

  // 获取变更文件列表
  public async getChangedFiles(): Promise<string[]> {
    try {
      const status = await this.executeCommand('status');
      const files: string[] = [];
      
      // 解析status输出，提取变更文件
      const lines = status.split('\n');
      for (const line of lines) {
        if (line.trim() === '') {
          continue;
        }
        
        // SVN状态输出格式: "状态码 文件路径"
        const match = /^([\?MADC!~])[\s\+]+(.+)$/.exec(line.trim());
        if (match) {
          const statusCode = match[1];
          const filePath = match[2];
          
          // 只关注已修改(M)、已添加(A)、已删除(D)、冲突(C)的文件
          if (['M', 'A', 'D', 'C'].includes(statusCode)) {
            files.push(filePath);
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error('获取SVN变更文件列表失败:', error);
      return [];
    }
  }

  // 执行提交操作
  public async commit(message: string, files?: string[]): Promise<boolean> {
    try {
      // 检查是否需要先更新
      const autoUpdate = this.configManager.get<boolean>('svn.autoUpdate', true);
      if (autoUpdate) {
        await this.update();
      }
      
      // 检查是否需要添加未版本化文件
      const addUnversioned = this.configManager.get<boolean>('svn.addUnversioned', false);
      if (addUnversioned) {
        await this.addUnversionedFiles();
      }
      
      // 构建提交命令 - 移除 --ignore-externals 选项，因为 commit 命令不支持此选项
      let args = ['commit', '-m', message];
      
      // 如果指定了文件，则只提交这些文件
      if (files && files.length > 0) {
        args = args.concat(files);
      }
      
      // 执行提交命令
      const result = await this.executeCommand(...args);
      
      // 检查提交结果
      if (result.includes('Committed revision')) {
        vscode.window.showInformationMessage('SVN提交成功');
        return true;
      } else {
        vscode.window.showWarningMessage(`SVN提交结果: ${result}`);
        return false;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`SVN提交失败: ${error}`);
      return false;
    }
  }

  // 执行更新操作
  public async update(): Promise<boolean> {
    try {
      // 构建更新命令
      let args = ['update'];
      
      // 是否忽略外部定义 - 这个选项应该用于 update 命令
      const ignoreExternals = this.configManager.get<boolean>('svn.ignoreExternals', true);
      if (ignoreExternals) {
        args.push('--ignore-externals');
      }
      
      const result = await this.executeCommand(...args);
      vscode.window.showInformationMessage('SVN更新成功');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`SVN更新失败: ${error}`);
      return false;
    }
  }

  // 查看历史记录
  public async viewHistory(filePath?: string): Promise<void> {
    try {
      let args = ['log', '--verbose'];
      if (filePath) {
        args.push(filePath);
      }
      
      const log = await this.executeCommand(...args);
      
      // 创建输出通道显示日志
      const outputChannel = vscode.window.createOutputChannel('SVN History');
      outputChannel.clear();
      outputChannel.append(log);
      outputChannel.show();
    } catch (error) {
      vscode.window.showErrorMessage(`获取SVN历史记录失败: ${error}`);
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
      
      // 使用SVN命令解决冲突
      const option = resolution === 'mine' ? '--accept=mine-full' : '--accept=theirs-full';
      await this.executeCommand('resolve', option, filePath);
      
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
      const status = await this.executeCommand('status');
      const conflictFiles: string[] = [];
      
      // 解析status输出，提取冲突文件
      const lines = status.split('\n');
      for (const line of lines) {
        if (line.trim() === '') {
          continue;
        }
        
        // 查找状态为C(冲突)的文件
        const match = /^C[\s\+]+(.+)$/.exec(line.trim());
        if (match) {
          conflictFiles.push(match[1]);
        }
      }
      
      return conflictFiles;
    } catch (error) {
      console.error('获取SVN冲突文件列表失败:', error);
      return [];
    }
  }

  // 添加未版本化文件
  private async addUnversionedFiles(): Promise<void> {
    try {
      const status = await this.executeCommand('status');
      const unversionedFiles: string[] = [];
      
      // 解析status输出，提取未版本化文件
      const lines = status.split('\n');
      for (const line of lines) {
        if (line.trim() === '') {
          continue;
        }
        
        // 查找状态为?(未版本化)的文件
        const match = /^\?[\s\+]+(.+)$/.exec(line.trim());
        if (match) {
          unversionedFiles.push(match[1]);
        }
      }
      
      // 添加未版本化文件
      if (unversionedFiles.length > 0) {
        await this.executeCommand('add', ...unversionedFiles);
      }
    } catch (error) {
      console.error('添加未版本化文件失败:', error);
    }
  }

  // 获取文件diff信息
  public async getFileDiff(filePath: string): Promise<string> {
    try {
      // 获取SVN diff
      const diff = await this.executeCommand('diff', filePath);
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

  // 执行SVN命令
  private async executeCommand(...args: string[]): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      // 获取SVN用户名和密码
      const username = this.configManager.get<string>('svn.username', '');
      const commandArgs = [...args];
      
      // 如果设置了用户名，添加到命令参数中
      if (username) {
        commandArgs.unshift('--username', username);
        
        // 尝试从安全存储中获取密码
        try {
          const password = await this.configManager.getCredential(username);
          if (password) {
            commandArgs.unshift('--password', password);
          }
        } catch (error) {
          console.log('未找到存储的密码，将提示用户输入');
        }
        
        // 添加非交互模式参数，避免密码提示
        commandArgs.unshift('--non-interactive');
        
        // 添加信任服务器证书参数
        commandArgs.unshift('--trust-server-cert');
      }
      
      // 执行SVN命令
      const process = cp.spawn(this.svnPath, commandArgs, { 
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', async (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          // 检查是否是认证错误
          if (stderr.includes('Can\'t get username or password') || 
              stderr.includes('Authentication failed') ||
              stderr.includes('E170001')) {
            
            // 提示用户输入认证信息
            const shouldSetupAuth = await vscode.window.showErrorMessage(
              'SVN认证失败，是否设置用户名和密码？',
              '设置认证信息',
              '取消'
            );
            
            if (shouldSetupAuth === '设置认证信息') {
              await this.setupAuthenticationInternal();
              reject('请重新尝试操作');
            } else {
              reject(stderr || `命令执行失败，退出码: ${code}`);
            }
          } else {
            reject(stderr || `命令执行失败，退出码: ${code}`);
          }
        }
      });
      
      process.on('error', (err) => {
        reject(`命令执行错误: ${err.message}`);
      });
    });
  }

  /**
   * 公共方法：设置SVN认证信息
   */
  public async setupAuthentication(): Promise<void> {
    return this.setupAuthenticationInternal();
  }

  /**
   * 内部方法：设置SVN认证信息
   */
  private async setupAuthenticationInternal(): Promise<void> {
    try {
      // 获取用户名
      const username = await vscode.window.showInputBox({
        prompt: '请输入SVN用户名',
        value: this.configManager.get<string>('svn.username', ''),
        ignoreFocusOut: true
      });

      if (!username) {
        return;
      }

      // 获取密码
      const password = await vscode.window.showInputBox({
        prompt: '请输入SVN密码',
        password: true,
        ignoreFocusOut: true
      });

      if (!password) {
        return;
      }

      // 保存用户名到配置
      await this.configManager.update('svn.username', username);

      // 保存密码到安全存储
      await this.configManager.saveCredential(username, password);

      vscode.window.showInformationMessage('SVN认证信息已保存');
    } catch (error) {
      vscode.window.showErrorMessage(`保存认证信息失败: ${error}`);
    }
  }
}