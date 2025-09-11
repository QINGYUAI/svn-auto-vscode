import * as vscode from 'vscode';
import { VcsManager } from './vcsManager';
import { ConfigManager } from './configManager';
import { StatusBarManager } from './statusBarManager';
import { CommandManager } from './commandManager';
import { AutoCommitManager } from './autoCommitManager';
import { CommitTemplateManager } from './commitTemplateManager';

// 插件激活时调用
export function activate(context: vscode.ExtensionContext) {
  console.log('SVN/Git 自动提交插件已激活');

  // 初始化配置管理器
  const configManager = new ConfigManager(context);

  // 初始化版本控制系统管理器
  const vcsManager = new VcsManager(configManager);

  // 初始化状态栏管理器
  const statusBarManager = new StatusBarManager(vcsManager, configManager);

  // 初始化提交信息模板管理器
  const commitTemplateManager = new CommitTemplateManager(configManager);

  // 初始化自动提交管理器
  const autoCommitManager = new AutoCommitManager(vcsManager, configManager, statusBarManager, commitTemplateManager);

  // 初始化命令管理器并注册命令
  const commandManager = new CommandManager(
    vcsManager,
    configManager,
    statusBarManager,
    autoCommitManager,
    commitTemplateManager
  );
  commandManager.registerCommands();

  // 初始化状态栏
  statusBarManager.initialize();

  // 检测当前工作区的版本控制系统
  vcsManager.detectVcsType().then(() => {
    statusBarManager.update();
  });

  // 监听配置变更
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('svn-auto-commit')) {
        configManager.reloadConfig();
        statusBarManager.update();
      }
    })
  );

  // 监听工作区变更
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      vcsManager.detectVcsType().then(() => {
        statusBarManager.update();
      });
    })
  );
}

// 插件停用时调用
export function deactivate() {
  console.log('SVN/Git 自动提交插件已停用');
}