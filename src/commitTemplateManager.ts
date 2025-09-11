import * as vscode from 'vscode';
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
   * @returns 格式化后的提交信息
   */
  public applyTemplate(files: string[]): string {
    const template = this.getTemplate();
    if (!template) {
      return '';
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
    const fileList = files.length <= 5 
      ? files.join(', ')
      : `${files.slice(0, 5).join(', ')} 等${files.length}个文件`;

    // 替换模板中的变量
    return template
      .replace(/{date}/g, date)
      .replace(/{time}/g, time)
      .replace(/{datetime}/g, datetime)
      .replace(/{username}/g, username || 'unknown')
      .replace(/{fileCount}/g, fileCount.toString())
      .replace(/{fileList}/g, fileList);
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
   * @returns 用户输入的提交信息，如果用户取消则返回undefined
   */
  public async showCommitMessageInput(files: string[]): Promise<string | undefined> {
    // 应用模板
    const defaultMessage = this.applyTemplate(files);

    // 显示输入框
    const message = await vscode.window.showInputBox({
      prompt: '请输入提交信息',
      value: defaultMessage,
      validateInput: (value) => this.validateMessage(value)
    });

    return message;
  }
}