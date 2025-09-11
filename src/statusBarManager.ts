import * as vscode from 'vscode';
import { VcsManager } from './vcsManager';
import { ConfigManager } from './configManager';

/**
 * 状态栏管理器
 * 负责在VSCode状态栏显示版本控制系统状态和操作按钮
 */
export class StatusBarManager {
  private vcsManager: VcsManager;
  private configManager: ConfigManager;
  private statusBarItem: vscode.StatusBarItem;
  private branchStatusBarItem: vscode.StatusBarItem;
  private updateStatusBarItem: vscode.StatusBarItem;
  private commitStatusBarItem: vscode.StatusBarItem;
  private historyStatusBarItem: vscode.StatusBarItem;

  constructor(vcsManager: VcsManager, configManager: ConfigManager) {
    this.vcsManager = vcsManager;
    this.configManager = configManager;
    
    // 创建主状态栏项
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'svn-vscode.showMenu';
    
    // 创建分支状态栏项
    this.branchStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.branchStatusBarItem.command = 'svn-vscode.showBranchInfo';
    
    // 创建更新状态栏项
    this.updateStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    this.updateStatusBarItem.command = 'svn-vscode.update';
    this.updateStatusBarItem.text = '$(sync)';
    this.updateStatusBarItem.tooltip = '更新/拉取';
    
    // 创建提交状态栏项
    this.commitStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    this.commitStatusBarItem.command = 'svn-vscode.commit';
    this.commitStatusBarItem.text = '$(git-commit)';
    this.commitStatusBarItem.tooltip = '提交更改';
    
    // 创建历史记录状态栏项
    this.historyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 96);
    this.historyStatusBarItem.command = 'svn-vscode.viewHistory';
    this.historyStatusBarItem.text = '$(history)';
    this.historyStatusBarItem.tooltip = '查看历史记录';
  }

  /**
   * 初始化状态栏
   */
  public async initialize(): Promise<void> {
    // 检查是否启用状态栏
    const showStatusBar = this.configManager.get<boolean>('statusBar.enabled', true);
    if (!showStatusBar) {
      this.hideAll();
      return;
    }
    
    // 更新状态栏显示
    await this.update();
    
    // 显示状态栏项
    this.showAll();
  }

  /**
   * 更新状态栏显示
   */
  public async update(): Promise<void> {
    try {
      // 获取版本控制系统类型
      const vcsType = this.vcsManager.getVcsType();
      if (!vcsType) {
        this.statusBarItem.text = '$(source-control) 未检测到版本控制';
        this.statusBarItem.tooltip = '未检测到SVN或Git版本控制系统';
        this.branchStatusBarItem.hide();
        this.updateStatusBarItem.hide();
        this.commitStatusBarItem.hide();
        this.historyStatusBarItem.hide();
        return;
      }
      
      // 更新主状态栏项
      this.statusBarItem.text = vcsType === 'svn' ? '$(source-control) SVN' : '$(git-branch) Git';
      this.statusBarItem.tooltip = `${vcsType.toUpperCase()} 版本控制系统`;
      
      // 获取并更新分支信息
      const branch = await this.vcsManager.getCurrentBranch();
      if (branch) {
        this.branchStatusBarItem.text = `$(git-branch) ${branch}`;
        this.branchStatusBarItem.tooltip = `当前分支: ${branch}`;
        this.branchStatusBarItem.show();
      } else {
        this.branchStatusBarItem.hide();
      }
      
      // 获取变更文件列表
      const changedFiles = await this.vcsManager.getChangedFiles();
      if (changedFiles.length > 0) {
        this.commitStatusBarItem.text = `$(git-commit) ${changedFiles.length}`;
        this.commitStatusBarItem.tooltip = `提交 ${changedFiles.length} 个更改`;
      } else {
        this.commitStatusBarItem.text = '$(git-commit)';
        this.commitStatusBarItem.tooltip = '提交更改';
      }
      
      // 检查是否有冲突
      const hasConflicts = await this.vcsManager.hasConflicts();
      if (hasConflicts) {
        this.statusBarItem.text = `$(alert) ${this.statusBarItem.text}`;
        this.statusBarItem.tooltip = `${this.statusBarItem.tooltip} (有冲突需要解决)`;
      }
    } catch (error) {
      console.error('更新状态栏失败:', error);
    }
  }

  /**
   * 显示所有状态栏项
   */
  public showAll(): void {
    this.statusBarItem.show();
    
    // 根据配置决定显示哪些状态栏项
    const showBranch = this.configManager.get<boolean>('statusBar.showBranch', true);
    const showUpdate = this.configManager.get<boolean>('statusBar.showUpdate', true);
    const showCommit = this.configManager.get<boolean>('statusBar.showCommit', true);
    const showHistory = this.configManager.get<boolean>('statusBar.showHistory', true);
    
    if (showBranch) {
      this.branchStatusBarItem.show();
    }
    
    if (showUpdate) {
      this.updateStatusBarItem.show();
    }
    
    if (showCommit) {
      this.commitStatusBarItem.show();
    }
    
    if (showHistory) {
      this.historyStatusBarItem.show();
    }
  }

  /**
   * 隐藏所有状态栏项
   */
  public hideAll(): void {
    this.statusBarItem.hide();
    this.branchStatusBarItem.hide();
    this.updateStatusBarItem.hide();
    this.commitStatusBarItem.hide();
    this.historyStatusBarItem.hide();
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.statusBarItem.dispose();
    this.branchStatusBarItem.dispose();
    this.updateStatusBarItem.dispose();
    this.commitStatusBarItem.dispose();
    this.historyStatusBarItem.dispose();
  }
}