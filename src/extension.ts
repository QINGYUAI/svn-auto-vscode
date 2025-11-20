import * as vscode from 'vscode';
import { VcsManager } from './vcsManager';
import { ConfigManager } from './configManager';
import { StatusBarManager } from './statusBarManager';
import { CommandManager } from './commandManager';
import { AutoCommitManager } from './autoCommitManager';
import { CommitTemplateManager } from './commitTemplateManager';
import { AiCommitMessageGenerator } from './aiCommitMessageGenerator';

// 插件激活时调用
export function activate(context: vscode.ExtensionContext) {
  console.log('SVN/Git 自动提交插件已激活');
  
  // 添加调试信息
  console.log('Extension context:', context.extensionPath);
  console.log('Workspace folders:', vscode.workspace.workspaceFolders?.length || 0);

  // 初始化配置管理器
  const configManager = new ConfigManager(context);
  
  // 检测 Cursor 编辑器环境（在初始化时检测一次）
  const aiGenerator = new AiCommitMessageGenerator(configManager);
  const isCursor = aiGenerator.isCursorEditor();
  console.log(`\n🎯 编辑器环境检测结果: ${isCursor ? '✅ 检测到 Cursor 编辑器' : '❌ 未检测到 Cursor 编辑器（使用 VSCode 或其他编辑器）'}`);
  console.log(`📌 AI 功能将${isCursor ? '优先使用 Cursor AI' : '使用配置的 AI 服务'}\n`);

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
  
  console.log('开始注册命令...');
  commandManager.registerCommands();
  console.log('命令注册完成');
  
  // 将命令管理器添加到订阅中，确保命令正确注册
  context.subscriptions.push(commandManager);
  console.log('命令管理器已添加到订阅，当前订阅数量:', context.subscriptions.length);

  // 初始化状态栏
  statusBarManager.initialize();
  
  // 将其他管理器也添加到订阅中
  context.subscriptions.push(statusBarManager);
  context.subscriptions.push(autoCommitManager);

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