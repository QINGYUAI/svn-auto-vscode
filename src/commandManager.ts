import * as vscode from 'vscode';
import * as path from 'path';
import { VcsManager } from './vcsManager';
import { ConfigManager } from './configManager';
import { StatusBarManager } from './statusBarManager';
import { AutoCommitManager } from './autoCommitManager';
import { CommitTemplateManager } from './commitTemplateManager';

/**
 * 命令管理器
 * 负责注册和处理插件的各种命令
 */
export class CommandManager {
  private vcsManager: VcsManager;
  private configManager: ConfigManager;
  private statusBarManager: StatusBarManager;
  private autoCommitManager: AutoCommitManager;
  private commitTemplateManager: CommitTemplateManager;
  private disposables: vscode.Disposable[] = [];

  constructor(
    vcsManager: VcsManager,
    configManager: ConfigManager,
    statusBarManager: StatusBarManager,
    autoCommitManager: AutoCommitManager,
    commitTemplateManager: CommitTemplateManager
  ) {
    this.vcsManager = vcsManager;
    this.configManager = configManager;
    this.statusBarManager = statusBarManager;
    this.autoCommitManager = autoCommitManager;
    this.commitTemplateManager = commitTemplateManager;
  }

  /**
   * 注册所有命令
   */
  public registerCommands(): void {
    // 注册提交命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.commit', () => this.commit())
    );

    // 注册更新命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.update', () => this.update())
    );

    // 注册查看历史记录命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.viewHistory', () => this.viewHistory())
    );

    // 注册显示菜单命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.showMenu', () => this.showMenu())
    );

    // 注册显示分支信息命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.showBranchInfo', () => this.showBranchInfo())
    );

    // 注册解决冲突命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.resolveConflict', (uri) => this.resolveConflict(uri))
    );

    // 注册打开设置命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.openSettings', () => this.openSettings())
    );

    // 注册启用/禁用自动提交命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-vscode.toggleAutoCommit', () => this.toggleAutoCommit())
    );
  }

  /**
   * 执行提交操作
   */
  private async commit(): Promise<void> {
    try {
      // 获取变更文件列表
      const changedFiles = await this.vcsManager.getChangedFiles();
      if (changedFiles.length === 0) {
        vscode.window.showInformationMessage('没有需要提交的更改');
        return;
      }

      // 显示文件选择器
      const selectedFiles = await this.showFileSelector(changedFiles);
      if (!selectedFiles || selectedFiles.length === 0) {
        return;
      }

      // 使用提交信息模板管理器获取提交信息
      const message = await this.commitTemplateManager.showCommitMessageInput(selectedFiles);

      if (!message) {
        return;
      }

      // 执行提交
      const success = await this.vcsManager.commit(message, selectedFiles);
      if (success) {
        // 更新状态栏
        await this.statusBarManager.update();
      }
    } catch (error) {
      vscode.window.showErrorMessage(`提交失败: ${error}`);
    }
  }

  /**
   * 执行更新操作
   */
  private async update(): Promise<void> {
    try {
      const success = await this.vcsManager.update();
      if (success) {
        // 更新状态栏
        await this.statusBarManager.update();
      }
    } catch (error) {
      vscode.window.showErrorMessage(`更新失败: ${error}`);
    }
  }

  /**
   * 查看历史记录
   */
  private async viewHistory(): Promise<void> {
    try {
      // 获取当前打开的文件
      const activeEditor = vscode.window.activeTextEditor;
      let filePath: string | undefined;

      if (activeEditor) {
        filePath = activeEditor.document.uri.fsPath;
      }

      // 查看历史记录
      await this.vcsManager.viewHistory(filePath);
    } catch (error) {
      vscode.window.showErrorMessage(`查看历史记录失败: ${error}`);
    }
  }

  /**
   * 显示菜单
   */
  private async showMenu(): Promise<void> {
    const items: vscode.QuickPickItem[] = [
      { label: '$(git-commit) 提交更改', description: '提交当前更改' },
      { label: '$(sync) 更新/拉取', description: '从远程仓库更新' },
      { label: '$(history) 查看历史记录', description: '查看版本历史' },
      { label: '$(gear) 打开设置', description: '配置插件设置' }
    ];

    // 检查是否有冲突需要解决
    const hasConflicts = await this.vcsManager.hasConflicts();
    if (hasConflicts) {
      items.unshift({ label: '$(alert) 解决冲突', description: '解决版本冲突' });
    }

    // 添加自动提交选项
    const autoCommitEnabled = this.configManager.get<boolean>('autoCommit.enabled', false);
    items.push({
      label: `$(${autoCommitEnabled ? 'check' : 'x'}) ${autoCommitEnabled ? '禁用' : '启用'}自动提交`,
      description: autoCommitEnabled ? '关闭自动提交功能' : '开启自动提交功能'
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择操作'
    });

    if (!selected) {
      return;
    }

    // 根据选择执行相应操作
    if (selected.label.includes('提交更改')) {
      await this.commit();
    } else if (selected.label.includes('更新/拉取')) {
      await this.update();
    } else if (selected.label.includes('查看历史记录')) {
      await this.viewHistory();
    } else if (selected.label.includes('解决冲突')) {
      await this.showConflictFiles();
    } else if (selected.label.includes('打开设置')) {
      this.openSettings();
    } else if (selected.label.includes('自动提交')) {
      await this.toggleAutoCommit();
    }
  }

  /**
   * 显示分支信息
   */
  private async showBranchInfo(): Promise<void> {
    try {
      const branch = await this.vcsManager.getCurrentBranch();
      if (branch) {
        vscode.window.showInformationMessage(`当前分支: ${branch}`);
      } else {
        vscode.window.showInformationMessage('无法获取分支信息');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`获取分支信息失败: ${error}`);
    }
  }

  /**
   * 显示冲突文件列表
   */
  private async showConflictFiles(): Promise<void> {
    try {
      const conflictFiles = await this.vcsManager.getConflictFiles();
      if (conflictFiles.length === 0) {
        vscode.window.showInformationMessage('没有冲突文件');
        return;
      }

      // 创建QuickPick项
      const items = conflictFiles.map(file => ({
        label: path.basename(file),
        description: file,
        file: file
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: '选择要解决冲突的文件'
      });

      if (!selected) {
        return;
      }

      // 解决冲突
      await this.resolveConflict(vscode.Uri.file(selected.file));
    } catch (error) {
      vscode.window.showErrorMessage(`获取冲突文件列表失败: ${error}`);
    }
  }

  /**
   * 解决冲突
   */
  private async resolveConflict(uri: vscode.Uri): Promise<void> {
    try {
      const filePath = uri.fsPath;
      const fileName = path.basename(filePath);

      // 显示解决冲突选项
      const options = [
        { label: '使用我的版本', value: 'mine' },
        { label: '使用他们的版本', value: 'theirs' },
        { label: '手动解决', value: 'manual' }
      ];

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: `选择如何解决 ${fileName} 的冲突`
      });

      if (!selected) {
        return;
      }

      // 解决冲突
      const success = await this.vcsManager.resolveConflict(
        filePath,
        selected.value as 'mine' | 'theirs' | 'manual'
      );

      if (success) {
        // 更新状态栏
        await this.statusBarManager.update();
      }
    } catch (error) {
      vscode.window.showErrorMessage(`解决冲突失败: ${error}`);
    }
  }

  /**
   * 打开设置
   */
  private openSettings(): void {
    vscode.commands.executeCommand('workbench.action.openSettings', 'svn-vscode');
  }

  /**
   * 启用/禁用自动提交
   */
  private async toggleAutoCommit(): Promise<void> {
    try {
      const currentValue = this.configManager.get<boolean>('autoCommit.enabled', false);
      await this.configManager.update('autoCommit.enabled', !currentValue);

      if (!currentValue) {
        // 启用自动提交
        this.autoCommitManager.start();
        vscode.window.showInformationMessage('已启用自动提交功能');
      } else {
        // 禁用自动提交
        this.autoCommitManager.stop();
        vscode.window.showInformationMessage('已禁用自动提交功能');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`切换自动提交状态失败: ${error}`);
    }
  }

  /**
   * 显示文件选择器
   */
  private async showFileSelector(files: string[]): Promise<string[] | undefined> {
    // 创建QuickPick项
    const items = files.map(file => ({
      label: path.basename(file),
      description: file,
      picked: true
    }));

    // 显示多选框
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择要提交的文件',
      canPickMany: true
    });

    if (!selected) {
      return undefined;
    }

    return selected.map(item => item.description);
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}