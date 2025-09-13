import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from './configManager';

/**
 * 提交信息模板管理器
 * 负责处理提交信息的格式化和模板应用
 */
export class CommitTemplateManager {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * 获取提交信息模板
   */
  public getTemplate(): string {
    return this.configManager.get<string>('commit.template', '');
  }

  /**
   * 应用提交信息模板
   * @param files 变更文件列表
   * @param context 提交上下文信息
   * @returns 格式化后的提交信息
   */
  public applyTemplate(files: string[], context?: { currentFile?: string; changeType?: string }): string {
    const template = this.getTemplate();
    if (!template) {
      // 如果没有模板，生成默认提交信息
      return this.generateDefaultMessage(files, context);
    }

    // 获取当前日期时间
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const datetime = now.toLocaleString();

    // 获取当前用户
    const username = this.configManager.get<string>('commit.username', '');

    // 获取文件数量
    const fileCount = files.length;

    // 获取文件列表（最多显示5个文件，超过则显示省略号）
    const fileList = this.formatFileList(files);

    // 检测变更类型
    const changeType = context?.changeType || this.detectChangeType(files);

    // 替换模板中的变量
    return template
      .replace(/{date}/g, date)
      .replace(/{time}/g, time)
      .replace(/{datetime}/g, datetime)
      .replace(/{username}/g, username || 'unknown')
      .replace(/{fileCount}/g, fileCount.toString())
      .replace(/{fileList}/g, fileList)
      .replace(/{changeType}/g, changeType);
  }

  /**
   * 生成默认提交信息
   * @param files 变更文件列表
   * @param context 上下文信息
   * @returns 默认提交信息
   */
  private generateDefaultMessage(files: string[], context?: { currentFile?: string; changeType?: string }): string {
    if (files.length === 0) {
      return '空提交';
    }

    const changeType = context?.changeType || this.detectChangeType(files);
    const fileList = this.formatFileList(files);

    // 根据文件数量和类型生成不同的消息
    if (files.length === 1) {
      const fileName = path.basename(files[0]);
      return `${changeType} ${fileName}`;
    } else {
      return `${changeType} ${fileList}`;
    }
  }

  /**
   * 格式化文件列表
   * @param files 文件列表
   * @returns 格式化后的文件列表字符串
   */
  private formatFileList(files: string[]): string {
    if (files.length === 0) {
      return '';
    }

    const fileNames = files.map(file => path.basename(file));
    
    if (fileNames.length <= 3) {
      return fileNames.join(', ');
    } else {
      return `${fileNames.slice(0, 3).join(', ')} 等${files.length}个文件`;
    }
  }

  /**
   * 检测变更类型
   * @param files 文件列表
   * @returns 变更类型描述
   */
  private detectChangeType(files: string[]): string {
    if (files.length === 0) {
      return '更新';
    }

    // 根据文件扩展名和数量推断变更类型
    const extensions = files.map(file => path.extname(file).toLowerCase());
    const hasCode = extensions.some(ext => ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext));
    const hasConfig = extensions.some(ext => ['.json', '.yml', '.yaml', '.xml', '.ini', '.conf'].includes(ext));
    const hasDoc = extensions.some(ext => ['.md', '.txt', '.doc', '.docx', '.pdf'].includes(ext));
    const hasStyle = extensions.some(ext => ['.css', '.scss', '.sass', '.less'].includes(ext));

    if (files.length === 1) {
      if (hasCode) return '修改';
      if (hasConfig) return '配置';
      if (hasDoc) return '文档';
      if (hasStyle) return '样式';
      return '更新';
    } else {
      if (hasCode && hasStyle) return '功能和样式';
      if (hasCode) return '功能';
      if (hasConfig) return '配置';
      if (hasDoc) return '文档';
      return '更新';
    }
  }

  /**
   * 验证提交信息是否符合规范
   * @param message 提交信息
   * @returns 是否符合规范，如果不符合则返回错误信息，符合则返回null
   */
  public validateMessage(message: string): string | null {
    // 检查是否启用验证
    const enableValidation = this.configManager.get<boolean>('commit.validateMessage', false);
    if (!enableValidation) {
      return null;
    }

    // 获取验证规则
    const minLength = this.configManager.get<number>('commit.minLength', 5);
    const maxLength = this.configManager.get<number>('commit.maxLength', 100);
    const requirePrefix = this.configManager.get<boolean>('commit.requirePrefix', false);
    const allowedPrefixes = this.configManager.get<string[]>('commit.allowedPrefixes', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'
    ]);

    // 检查长度
    if (message.length < minLength) {
      return `提交信息太短，最少需要${minLength}个字符`;
    }

    if (message.length > maxLength) {
      return `提交信息太长，最多允许${maxLength}个字符`;
    }

    // 检查前缀
    if (requirePrefix) {
      const prefixRegex = new RegExp(`^(${allowedPrefixes.join('|')}):\s.+`);
      if (!prefixRegex.test(message)) {
        return `提交信息必须以有效的前缀开头，如: "${allowedPrefixes[0]}: 你的提交信息"`;
      }
    }

    return null;
  }

  /**
   * 显示提交信息输入框
   * @param files 变更文件列表
   * @param context 提交上下文信息
   * @returns 用户输入的提交信息，如果用户取消则返回undefined
   */
  public async showCommitMessageInput(files: string[], context?: { currentFile?: string; changeType?: string }): Promise<string | undefined> {
    // 检查是否启用自动生成提交信息
    const autoGenerate = this.configManager.get<boolean>('contextAware.autoGenerateMessage', true);
    
    // 应用模板
    const defaultMessage = this.applyTemplate(files, context);

    // 如果启用自动生成且有默认消息，直接返回
    if (autoGenerate && defaultMessage && defaultMessage.trim()) {
      return defaultMessage;
    }

    // 显示输入框
    const message = await vscode.window.showInputBox({
      prompt: '请输入提交信息',
      value: defaultMessage,
      validateInput: (value) => this.validateMessage(value)
    });

    return message;
  }

  /**
   * 生成上下文感知的提交信息
   * @param files 变更文件列表
   * @param currentFile 当前文件路径
   * @returns 提交信息
   */
  public generateContextAwareMessage(files: string[], currentFile?: string): string {
    const context = {
      currentFile,
      changeType: this.detectChangeType(files)
    };

    return this.applyTemplate(files, context);
  }
}