import * as vscode from 'vscode';
import { setTimeout, clearTimeout } from 'timers';
import { VcsManager } from './vcsManager';
import { minimatch } from 'minimatch';
import { ConfigManager } from './configManager';
import { StatusBarManager } from './statusBarManager';
import { CommitTemplateManager } from './commitTemplateManager';

/**
 * 自动提交管理器
 * 负责监控文件变更并自动提交
 */
export class AutoCommitManager {
  private vcsManager: VcsManager;
  private configManager: ConfigManager;
  private statusBarManager: StatusBarManager;
  private commitTemplateManager: CommitTemplateManager;
  private fileSystemWatcher: vscode.FileSystemWatcher | undefined;
  private changeTimeout: ReturnType<typeof setTimeout> | undefined;
  private isEnabled: boolean = false;
  private pendingChanges: Set<string> = new Set();

  constructor(
    vcsManager: VcsManager,
    configManager: ConfigManager,
    statusBarManager: StatusBarManager,
    commitTemplateManager: CommitTemplateManager
  ) {
    this.vcsManager = vcsManager;
    this.configManager = configManager;
    this.statusBarManager = statusBarManager;
    this.commitTemplateManager = commitTemplateManager;
  }

  /**
   * 初始化自动提交功能
   */
  public initialize(): void {
    // 检查是否启用自动提交
    const enabled = this.configManager.get<boolean>('autoCommit.enabled', false);
    if (enabled) {
      this.start();
    }
  }

  /**
   * 启动自动提交功能
   */
  public start(): void {
    if (this.isEnabled) {
      return;
    }

    this.isEnabled = true;
    this.pendingChanges.clear();

    // 创建文件系统监视器
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri;
    this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceRoot, '**/*')
    );

    // 监听文件创建事件
    this.fileSystemWatcher.onDidCreate(uri => {
      this.handleFileChange(uri.fsPath);
    });

    // 监听文件更改事件
    this.fileSystemWatcher.onDidChange(uri => {
      this.handleFileChange(uri.fsPath);
    });

    // 监听文件删除事件
    this.fileSystemWatcher.onDidDelete(uri => {
      this.handleFileChange(uri.fsPath);
    });

    console.log('自动提交功能已启动');
  }

  /**
   * 停止自动提交功能
   */
  public stop(): void {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;
    this.pendingChanges.clear();

    // 清除定时器
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
      this.changeTimeout = undefined;
    }

    // 释放文件系统监视器
    if (this.fileSystemWatcher) {
      this.fileSystemWatcher.dispose();
      this.fileSystemWatcher = undefined;
    }

    console.log('自动提交功能已停止');
  }

  /**
   * 处理文件变更
   */
  private handleFileChange(filePath: string): void {
    // 检查是否应该忽略此文件
    if (this.shouldIgnoreFile(filePath)) {
      return;
    }

    // 添加到待处理变更列表
    this.pendingChanges.add(filePath);

    // 清除之前的定时器
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }

    // 设置新的定时器
    const delay = this.configManager.get<number>('autoCommit.delay', 30) * 1000; // 转换为毫秒
    this.changeTimeout = setTimeout(() => this.commitChanges(), delay);
  }

  /**
   * 检查是否应该忽略此文件
   */
  private shouldIgnoreFile(filePath: string): boolean {
    // 获取忽略模式
    const ignorePatterns = this.configManager.get<string[]>('autoCommit.ignorePatterns', [
      '**/.git/**',
      '**/node_modules/**',
      '**/.svn/**'
    ]);

    // 检查文件是否匹配忽略模式
    for (const pattern of ignorePatterns) {
      // 使用minimatch进行文件路径匹配
      if (minimatch(filePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 提交变更
   */
  private async commitChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) {
      return;
    }

    try {
      // 获取文件列表
      const files = Array.from(this.pendingChanges).map(file => {
        const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
        return file.replace(workspacePath + '/', '');
      });
      
      // 使用提交信息模板管理器生成提交信息
      const autoCommitTemplate = this.configManager.get<string>('autoCommit.messageTemplate', '');
      
      // 如果设置了自动提交专用模板，则使用它，否则使用通用模板
      let message: string;
      if (autoCommitTemplate) {
        message = autoCommitTemplate
          .replace('{files}', files.join(', '))
          .replace('{date}', new Date().toLocaleString())
          .replace('{count}', this.pendingChanges.size.toString());
      } else {
        message = this.commitTemplateManager.applyTemplate(files);
        // 如果没有模板，则使用默认的自动提交信息
        if (!message) {
          message = `自动提交: ${files.length} 个文件更改`;
        }
      }
      
      // 执行提交
      const filesToCommit = Array.from(this.pendingChanges);
      const success = await this.vcsManager.commit(message, filesToCommit);
      
      if (success) {
        // 清空待处理变更列表
        this.pendingChanges.clear();
        
        // 更新状态栏
        await this.statusBarManager.update();
        
        // 显示通知
        const showNotification = this.configManager.get<boolean>('autoCommit.showNotification', true);
        if (showNotification) {
          vscode.window.showInformationMessage(`自动提交成功: ${filesToCommit.length} 个文件`);
        }
      }
    } catch (error) {
      console.error('自动提交失败:', error);
      
      // 显示错误通知
      const showNotification = this.configManager.get<boolean>('autoCommit.showNotification', true);
      if (showNotification) {
        vscode.window.showErrorMessage(`自动提交失败: ${error}`);
      }
    }
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.stop();
  }
}