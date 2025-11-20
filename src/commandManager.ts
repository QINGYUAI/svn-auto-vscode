import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { VcsManager } from './vcsManager';
import { ConfigManager } from './configManager';
import { StatusBarManager } from './statusBarManager';
import { AutoCommitManager } from './autoCommitManager';
import { CommitTemplateManager } from './commitTemplateManager';

/**
 * 命令管理器
 * 负责注册和处理插件的各种命令
 */
export class CommandManager implements vscode.Disposable {
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
    console.log('CommandManager: 开始注册命令');

    // 注册提交命令
    console.log('注册命令: svn-auto-commit.commit');
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.commit', (uri?: vscode.Uri) => this.commit(uri))
    );

    // 注册更新命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.update', () => this.update())
    );

    // 注册查看历史记录命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.viewHistory', () => this.viewHistory())
    );

    // 注册显示菜单命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.showMenu', () => this.showMenu())
    );

    // 注册显示分支信息命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.showBranchInfo', () => this.showBranchInfo())
    );

    // 注册解决冲突命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.resolveConflict', (uri) => this.resolveConflict(uri))
    );

    // 注册打开设置命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.openSettings', () => this.openSettings())
    );

    // 注册启用/禁用自动提交命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.autoCommit', () => this.toggleAutoCommit())
    );

    // 注册设置SVN认证命令
    console.log('注册命令: svn-auto-commit.setupSvnAuth');
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.setupSvnAuth', () => this.setupSvnAuthentication())
    );

    // 注册设置AI API密钥命令
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.setupAiApiKey', () => this.setupAiApiKey())
    );

    // 注册AI生成提交信息命令（用于SCM输入框）
    this.disposables.push(
      vscode.commands.registerCommand('svn-auto-commit.generateCommitMessage', () => this.generateCommitMessageForScm())
    );

    console.log('CommandManager: 所有命令注册完成，总计:', this.disposables.length, '个命令');
  }

  /**
   * 执行提交操作
   * @param uri 可选的文件URI，用于上下文感知提交
   */
  private async commit(uri?: vscode.Uri): Promise<void> {
    try {
      // 获取变更文件列表
      const changedFiles = await this.vcsManager.getChangedFiles();
      if (changedFiles.length === 0) {
        vscode.window.showInformationMessage('没有需要提交的更改');
        return;
      }

      // 检测提交上下文
      const context = this.detectCommitContext(uri);

      // 根据上下文选择文件
      const selectedFiles = await this.selectFilesWithContext(changedFiles, context);
      if (!selectedFiles || selectedFiles.length === 0) {
        return;
      }

      // 获取文件diff信息（用于AI生成）
      // 将相对路径转换为绝对路径
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
      const absoluteFiles = selectedFiles.map(file => {
        if (path.isAbsolute(file)) {
          return file;
        }
        return path.join(workspaceRoot, file);
      });
      const diffs = await this.vcsManager.getFilesDiff(absoluteFiles);

      // 使用提交信息模板管理器获取提交信息
      const commitContext = {
        currentFile: context.currentFile,
        changeType: undefined // 将由模板管理器自动检测
      };
      const message = await this.commitTemplateManager.showCommitMessageInput(selectedFiles, commitContext, diffs);

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
   * 检测提交上下文
   * @param uri 文件URI
   * @returns 提交上下文信息
   */
  private detectCommitContext(uri?: vscode.Uri): {
    source: 'editor' | 'explorer' | 'command';
    currentFile?: string;
  } {
    let currentFile: string | undefined;
    let source: 'editor' | 'explorer' | 'command' = 'command';

    if (uri) {
      // 从资源管理器或编辑器标题栏调用
      currentFile = uri.fsPath;
      source = 'explorer';
    } else {
      // 从命令面板或快捷键调用，检查当前活动编辑器
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        currentFile = activeEditor.document.uri.fsPath;
        source = 'editor';
      }
    }

    return { source, currentFile };
  }

  /**
   * 根据上下文选择文件
   * @param changedFiles 所有变更文件
   * @param context 提交上下文
   * @returns 选择的文件列表
   */
  private async selectFilesWithContext(
    changedFiles: string[],
    context: { source: 'editor' | 'explorer' | 'command'; currentFile?: string }
  ): Promise<string[] | undefined> {
    // 如果只有一个文件变更，直接返回该文件，不需要选择界面
    if (changedFiles.length === 1) {
      return changedFiles;
    }

    const contextAwareEnabled = this.configManager.get<boolean>('contextAware.enabled', true);
    const autoSelectCurrent = this.configManager.get<boolean>('contextAware.autoSelectCurrentFile', true);
    const skipSelection = this.configManager.get<boolean>('contextAware.skipFileSelection', false);

    // 如果未启用上下文感知，使用原有逻辑
    if (!contextAwareEnabled) {
      return this.showFileSelector(changedFiles);
    }

    // 检查当前文件是否在变更列表中
    let currentFileInChanges = false;
    if (context.currentFile) {
      currentFileInChanges = changedFiles.includes(context.currentFile);
    }

    // 如果是从编辑器上下文且当前文件有变更
    if (context.source === 'editor' && currentFileInChanges && autoSelectCurrent) {
      // 如果只有当前文件变更且启用跳过选择，直接返回当前文件
      if (changedFiles.length === 1 && skipSelection) {
        return [context.currentFile!];
      }

      // 否则显示文件选择器，但预选当前文件
      return this.showFileSelector(changedFiles, context.currentFile);
    }

    // 如果是从资源管理器上下文且选中文件有变更
    if (context.source === 'explorer' && currentFileInChanges && autoSelectCurrent) {
      // 预选当前文件
      return this.showFileSelector(changedFiles, context.currentFile);
    }

    // 默认显示所有文件选择器
    return this.showFileSelector(changedFiles);
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

    // 如果是SVN项目，添加认证设置选项
    const vcsType = await this.vcsManager.getVcsType();
    if (vcsType === 'svn') {
      items.push({
        label: '$(key) 设置SVN认证',
        description: '配置SVN用户名和密码'
      });
    }

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
    } else if (selected.label.includes('设置SVN认证')) {
      await this.setupSvnAuthentication();
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
    vscode.commands.executeCommand('workbench.action.openSettings', 'svn-auto-commit');
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
   * @param files 文件列表
   * @param preselectedFile 预选文件路径
   */
  private async showFileSelector(files: string[], preselectedFile?: string): Promise<string[] | undefined> {
    // 创建QuickPick项
    const items = files.map(file => ({
      label: path.basename(file),
      description: file,
      picked: preselectedFile ? file === preselectedFile : true // 如果有预选文件，只选中该文件，否则全选
    }));

    // 显示多选框
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: preselectedFile
        ? `选择要提交的文件 (已预选: ${path.basename(preselectedFile)})`
        : '选择要提交的文件',
      canPickMany: true
    });

    if (!selected) {
      return undefined;
    }

    return selected.map(item => item.description);
  }

  /**
   * 为SCM输入框生成AI提交信息
   */
  private async generateCommitMessageForScm(): Promise<void> {
    try {
      // 检查AI功能是否启用
      const aiEnabled = this.configManager.get<boolean>('ai.enabled', false);
      if (!aiEnabled) {
        const enable = await vscode.window.showWarningMessage(
          'AI功能未启用，是否现在启用？',
          { modal: true },
          '启用AI功能',
          '取消'
        );
        if (enable === '启用AI功能') {
          await this.configManager.update('ai.enabled', true);
        } else {
          return;
        }
      }

      // 获取变更文件列表
      const changedFiles = await this.vcsManager.getChangedFiles();
      if (changedFiles.length === 0) {
        vscode.window.showInformationMessage('没有需要提交的更改');
        return;
      }

      // 获取文件diff信息
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
      const absoluteFiles = changedFiles.map(file => {
        if (path.isAbsolute(file)) {
          return file;
        }
        return path.join(workspaceRoot, file);
      });
      const diffs = await this.vcsManager.getFilesDiff(absoluteFiles);

      if (diffs.size === 0) {
        vscode.window.showWarningMessage('无法获取文件变更内容，请确保文件已保存');
        return;
      }

      // 使用AI生成提交信息
      const commitTemplateManager = this.commitTemplateManager as any;
      if (!commitTemplateManager.aiGenerator) {
        vscode.window.showErrorMessage('AI生成器未初始化，请重启VSCode后重试');
        return;
      }

      // 获取当前使用的AI服务
      const currentProvider = this.configManager.get<string>('ai.provider', 'openai');
      const providerNames: { [key: string]: string } = {
        'openai': 'OpenAI',
        'claude': 'Claude',
        'gemini': 'Gemini',
        'qwen': '通义千问',
        'ernie': '文心一言',
        'deepseek': 'DeepSeek',
        'moonshot': 'Moonshot',
        'custom': '自定义AI'
      };
      const providerLabel = providerNames[currentProvider] || currentProvider;

      // 显示进度并生成
      const generatedMessage = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `🤖 正在使用 ${providerLabel} 生成提交信息...`,
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 0, message: '分析代码变更' });
          
          setTimeout(() => {
            progress.report({ increment: 50, message: '调用AI服务' });
          }, 500);

          const message = await commitTemplateManager.aiGenerator.generateCommitMessage(
            changedFiles,
            diffs
          );

          progress.report({ increment: 100, message: message ? '生成完成' : '生成失败' });
          return message;
        }
      );

      if (generatedMessage) {
        // 将生成的提交信息复制到剪贴板
        await vscode.env.clipboard.writeText(generatedMessage);
        
        // 尝试设置SCM输入框的值
        // 注意：VSCode的SCM API需要通过SCM提供者访问，这里我们使用命令和剪贴板的方式
        
        // 先聚焦到SCM视图
        await vscode.commands.executeCommand('workbench.view.scm');
        
        // 显示成功消息并提供操作选项
        const action = await vscode.window.showInformationMessage(
          `✅ AI已生成提交信息: ${generatedMessage.substring(0, 50)}${generatedMessage.length > 50 ? '...' : ''}`,
          '自动填入输入框',
          '查看完整信息',
          '使用此信息提交'
        );
        
        if (action === '自动填入输入框') {
          // 尝试聚焦到输入框并粘贴
          setTimeout(async () => {
            try {
              // 聚焦到SCM输入框
              await vscode.commands.executeCommand('scm.inputBox.focus');
              
              // 等待输入框聚焦后，尝试设置值
              // 由于VSCode API限制，我们使用剪贴板+粘贴的方式
              setTimeout(async () => {
                // 选中所有文本（如果有）
                await vscode.commands.executeCommand('editor.action.selectAll');
                // 粘贴剪贴板内容
                await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                
                vscode.window.showInformationMessage('✅ 已填入提交信息输入框，您可以编辑后提交');
              }, 300);
            } catch (error) {
              // 如果自动填入失败，提示用户手动粘贴
              vscode.window.showInformationMessage(
                '已复制到剪贴板，请在提交信息输入框中按 Ctrl+V (Mac: Cmd+V) 粘贴',
                '知道了'
              );
            }
          }, 200);
        } else if (action === '查看完整信息') {
          // 显示完整信息对话框
          const fullMessage = await vscode.window.showInputBox({
            prompt: 'AI生成的完整提交信息',
            value: generatedMessage,
            placeHolder: '可编辑后确认',
            ignoreFocusOut: false
          });
          
          if (fullMessage) {
            // 更新剪贴板
            await vscode.env.clipboard.writeText(fullMessage);
            vscode.window.showInformationMessage('已更新剪贴板，请在输入框中粘贴');
          }
        } else if (action === '使用此信息提交') {
          // 直接使用生成的提交信息进行提交
          const confirm = await vscode.window.showQuickPick([
            { label: '$(git-commit) 确认提交', value: 'yes' },
            { label: '$(close) 取消', value: 'no' }
          ], {
            placeHolder: `将使用提交信息: ${generatedMessage}`
          });
          
          if (confirm?.value === 'yes') {
            const success = await this.vcsManager.commit(generatedMessage, changedFiles);
            if (success) {
              await this.statusBarManager.update();
              vscode.window.showInformationMessage('✅ 提交成功');
            }
          }
        }
      } else {
        vscode.window.showWarningMessage('AI生成提交信息失败，请检查AI配置或使用模板生成');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`AI生成提交信息失败: ${error?.message || error}`);
    }
  }

  /**
   * 设置AI API密钥
   */
  private async setupAiApiKey(): Promise<void> {
    try {
      // 获取所有AI提供商及其密钥状态
      const commitTemplateManager = this.commitTemplateManager as any;
      if (!commitTemplateManager.aiGenerator) {
        vscode.window.showErrorMessage('AI生成器未初始化，请重启VSCode后重试');
        return;
      }

      const availableProviders = await commitTemplateManager.aiGenerator.getAvailableProviders();
      const currentProvider = this.configManager.get<string>('ai.provider', 'openai');
      const aiEnabled = this.configManager.get<boolean>('ai.enabled', false);
      
      // 构建选项列表，显示哪些已配置密钥
      interface ProviderOption extends vscode.QuickPickItem {
        providerName: string;
        hasKey: boolean;
      }
      
      // 按状态分组：已配置的在前，未配置的在后
      const configuredProviders = availableProviders.filter((p: { hasKey: boolean }) => p.hasKey);
      const unconfiguredProviders = availableProviders.filter((p: { hasKey: boolean }) => !p.hasKey);
      
      const providerOptions: ProviderOption[] = [
        // 已配置的AI服务
        ...configuredProviders.map((provider: { name: string; label: string; hasKey: boolean }) => ({
          label: `$(check) ${provider.label}`,
          providerName: provider.name,
          hasKey: true,
          description: provider.name === currentProvider ? '✓ 当前使用' : '已配置',
          detail: provider.name === currentProvider 
            ? '当前正在使用的AI服务，点击可重新设置或删除'
            : '已配置密钥，点击可重新设置或删除'
        })),
        // 分隔线
        ...(configuredProviders.length > 0 && unconfiguredProviders.length > 0 ? [{
          label: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          providerName: '',
          hasKey: false,
          description: '',
          detail: ''
        }] : []),
        // 未配置的AI服务
        ...unconfiguredProviders.map((provider: { name: string; label: string; hasKey: boolean }) => ({
          label: `$(circle-outline) ${provider.label}`,
          providerName: provider.name,
          hasKey: false,
          description: '未配置',
          detail: '点击进行配置'
        }))
      ];
      
      // 添加帮助信息
      const helpInfo: ProviderOption = {
        label: '$(info) 查看帮助文档',
        providerName: '__help__',
        hasKey: false,
        description: '了解如何获取API密钥',
        detail: '打开AI功能使用指南'
      };
      providerOptions.push(helpInfo);
      
      const selectedProvider = await vscode.window.showQuickPick(providerOptions, {
        placeHolder: aiEnabled 
          ? `选择AI服务提供商（当前: ${availableProviders.find((p: { name: string }) => p.name === currentProvider)?.label || currentProvider}）`
          : '选择AI服务提供商（提示：需要先启用AI功能）',
        ignoreFocusOut: false
      });
      
      if (!selectedProvider) {
        return;
      }

      // 处理帮助信息
      if (selectedProvider.providerName === '__help__') {
        // 尝试打开文档
        try {
          const extension = vscode.extensions.getExtension('QINGYUAI.svn-git-auto-commit');
          if (extension) {
            const docPath = vscode.Uri.joinPath(
              vscode.Uri.file(extension.extensionPath),
              'docs',
              'AI提交信息生成指南.md'
            );
            vscode.commands.executeCommand('markdown.showPreview', docPath);
          } else {
            vscode.window.showInformationMessage('请查看文档: docs/AI提交信息生成指南.md');
          }
        } catch (error) {
          vscode.window.showInformationMessage('请查看文档: docs/AI提交信息生成指南.md');
        }
        return;
      }

      const providerInfo = availableProviders.find((p: { name: string; label: string; hasKey: boolean }) => p.name === selectedProvider.providerName);
      if (!providerInfo) {
        return;
      }

      // 如果已配置密钥，询问是否重新设置
      if (providerInfo.hasKey) {
        const action = await vscode.window.showQuickPick([
          { 
            label: '$(edit) 重新设置密钥', 
            value: 'update',
            description: '更新API密钥',
            detail: '将替换当前保存的密钥'
          },
          { 
            label: '$(trash) 删除密钥', 
            value: 'delete',
            description: '删除已保存的密钥',
            detail: '删除后需要重新配置才能使用'
          },
          { 
            label: '$(settings-gear) 查看配置', 
            value: 'config',
            description: '查看当前配置',
            detail: '查看模型、API地址等配置项'
          },
          { 
            label: '$(close) 取消', 
            value: 'cancel',
            description: '取消操作'
          }
        ], {
          placeHolder: `${providerInfo.label} - 选择操作`,
          ignoreFocusOut: false
        });

        if (!action || action.value === 'cancel') {
          return;
        }

        if (action.value === 'config') {
          // 显示配置信息
          await this.showAiConfig(selectedProvider.providerName, providerInfo.label);
          return;
        }

        if (action.value === 'delete') {
          // 确认删除
          const confirm = await vscode.window.showWarningMessage(
            `确定要删除 ${providerInfo.label} 的API密钥吗？`,
            { modal: true },
            '确定删除',
            '取消'
          );
          
          if (confirm === '确定删除') {
            await this.configManager.deleteCredential(`ai-${selectedProvider.providerName}-apikey`);
            
            // 如果删除的是当前使用的AI，提示用户
            if (selectedProvider.providerName === currentProvider) {
              vscode.window.showWarningMessage(
                `${providerInfo.label} API密钥已删除。请重新配置或切换到其他AI服务。`,
                '重新配置',
                '查看其他AI'
              ).then(choice => {
                if (choice === '重新配置') {
                  this.setupAiApiKey();
                } else if (choice === '查看其他AI') {
                  this.setupAiApiKey();
                }
              });
            } else {
              vscode.window.showInformationMessage(`${providerInfo.label} API密钥已删除`);
            }
          }
          return;
        }
      }
      
      // 显示配置提示信息
      const configHint = this.getProviderConfigHint(selectedProvider.providerName);
      if (configHint) {
        const showHint = await vscode.window.showInformationMessage(
          configHint.message,
          { modal: false },
          '继续配置',
          '查看文档'
        );
        
        if (showHint === '查看文档') {
          try {
            const extension = vscode.extensions.getExtension('QINGYUAI.svn-git-auto-commit');
            if (extension) {
              const docPath = vscode.Uri.joinPath(
                vscode.Uri.file(extension.extensionPath),
                'docs',
                'AI提交信息生成指南.md'
              );
              vscode.commands.executeCommand('markdown.showPreview', docPath);
            } else {
              vscode.window.showInformationMessage('请查看文档: docs/AI提交信息生成指南.md');
            }
          } catch (error) {
            vscode.window.showInformationMessage('请查看文档: docs/AI提交信息生成指南.md');
          }
          return;
        }
      }
      
      // 获取API密钥
      const apiKey = await vscode.window.showInputBox({
        prompt: `请输入 ${providerInfo.label} 的API密钥`,
        placeHolder: configHint?.placeholder || 'sk-... 或您的API密钥',
        password: true,
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'API密钥不能为空';
          }
          if (value.trim().length < 10) {
            return 'API密钥长度似乎不正确，请检查';
          }
          return null;
        }
      });
      
      if (!apiKey) {
        return;
      }
      
      // 显示保存进度
      const progressOptions: vscode.ProgressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: `正在保存 ${providerInfo.label} API密钥...`,
        cancellable: false
      };
      
      await vscode.window.withProgress(progressOptions, async () => {
        // 保存API密钥到安全存储
        await commitTemplateManager.aiGenerator.saveApiKey(selectedProvider.providerName, apiKey);
        
        // 自动切换到当前配置的AI
        await this.configManager.update('ai.provider', selectedProvider.providerName);
      });
      
      // 显示成功消息并提供后续操作
      const result = await vscode.window.showInformationMessage(
        `✅ ${providerInfo.label} API密钥已保存并已切换为该服务`,
        '启用AI功能',
        '查看配置',
        '完成'
      );
      
      if (result === '启用AI功能') {
        await this.configManager.update('ai.enabled', true);
        vscode.window.showInformationMessage('AI功能已启用，现在可以使用AI生成提交信息了');
      } else if (result === '查看配置') {
        await this.showAiConfig(selectedProvider.providerName, providerInfo.label);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`设置AI API密钥失败: ${error?.message || error}`);
    }
  }

  /**
   * 显示AI配置信息
   */
  private async showAiConfig(providerName: string, providerLabel: string): Promise<void> {
    const configPrefix = `svn-auto-commit.ai.${providerName}`;
    const model = this.configManager.get<string>(`${configPrefix}.model`, '');
    const apiUrl = this.configManager.get<string>(`${configPrefix}.apiUrl`, '');
    
    const configItems: vscode.QuickPickItem[] = [
      {
        label: `$(gear) 模型名称`,
        description: model || '使用默认值',
        detail: `当前配置: ${model || '未设置'}`
      },
      {
        label: `$(globe) API地址`,
        description: apiUrl || '使用默认值',
        detail: `当前配置: ${apiUrl || '未设置'}`
      },
      {
        label: `$(settings-gear) 打开设置`,
        description: '在设置中修改配置',
        detail: '打开VSCode设置页面'
      }
    ];
    
    const selected = await vscode.window.showQuickPick(configItems, {
      placeHolder: `${providerLabel} - 配置信息`
    });
    
    if (selected?.label.includes('打开设置')) {
      vscode.commands.executeCommand('workbench.action.openSettings', `@ext:QINGYUAI.svn-git-auto-commit ${configPrefix}`);
    }
  }

  /**
   * 获取AI提供商的配置提示信息
   */
  private getProviderConfigHint(providerName: string): { message: string; placeholder: string } | null {
    const hints: { [key: string]: { message: string; placeholder: string } } = {
      'openai': {
        message: 'OpenAI API密钥通常以 "sk-" 开头。您可以在 https://platform.openai.com/api-keys 获取',
        placeholder: 'sk-...'
      },
      'claude': {
        message: 'Claude API密钥通常以 "sk-ant-" 开头。您可以在 https://console.anthropic.com/ 获取',
        placeholder: 'sk-ant-...'
      },
      'gemini': {
        message: 'Gemini API密钥可以在 https://makersuite.google.com/app/apikey 获取',
        placeholder: '您的API密钥'
      },
      'qwen': {
        message: '通义千问API密钥可以在阿里云控制台获取',
        placeholder: '您的API密钥'
      },
      'ernie': {
        message: '文心一言需要access_token，可以在百度智能云控制台获取',
        placeholder: 'access_token'
      },
      'deepseek': {
        message: 'DeepSeek API密钥可以在 https://platform.deepseek.com/ 获取',
        placeholder: 'sk-...'
      },
      'moonshot': {
        message: 'Moonshot API密钥可以在 https://platform.moonshot.cn/ 获取',
        placeholder: 'sk-...'
      },
      'custom': {
        message: '请确保已配置API地址、请求格式和响应路径',
        placeholder: '您的API密钥'
      }
    };
    
    return hints[providerName] || null;
  }

  /**
   * 设置SVN认证信息
   */
  private async setupSvnAuthentication(): Promise<void> {
    try {
      // 检查当前是否使用SVN
      const currentVcs = await this.vcsManager.getVcsType();
      if (currentVcs !== 'svn') {
        vscode.window.showWarningMessage('当前项目不是SVN项目');
        return;
      }

      // 获取SVN提供者并设置认证
      const svnProvider = this.vcsManager.getCurrentProvider();
      if (svnProvider && 'setupAuthentication' in svnProvider) {
        await (svnProvider as any).setupAuthentication();
      } else {
        vscode.window.showErrorMessage('无法获取SVN提供者');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`设置SVN认证失败: ${error}`);
    }
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}