import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './configManager';
import { SvnProvider } from './providers/svnProvider';
import { GitProvider } from './providers/gitProvider';
import { VcsProvider } from './providers/vcsProvider';

// 版本控制系统类型
export enum VcsType {
  NONE = 'none',
  SVN = 'svn',
  GIT = 'git'
}

// 版本控制系统管理器类
export class VcsManager {
  private configManager: ConfigManager;
  private currentVcsType: VcsType = VcsType.NONE;
  private vcsProvider: VcsProvider | null = null;
  private svnProvider: SvnProvider | null = null;
  private gitProvider: GitProvider | null = null;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  // 获取当前版本控制系统类型
  public getVcsType(): VcsType {
    return this.currentVcsType;
  }

  // 获取当前版本控制系统提供者
  public getVcsProvider(): VcsProvider | null {
    return this.vcsProvider;
  }

  // 获取当前提供者实例（用于访问特定方法）
  public getCurrentProvider(): VcsProvider | null {
    return this.vcsProvider;
  }

  // 检查是否有冲突文件
  public async hasConflicts(): Promise<boolean> {
    if (!this.vcsProvider) {
      return false;
    }
    const conflictFiles = await this.getConflictFiles();
    return conflictFiles.length > 0;
  }

  // 获取冲突文件列表
  public async getConflictFiles(): Promise<string[]> {
    if (!this.vcsProvider) {
      return [];
    }
    return this.vcsProvider.getConflictFiles();
  }

  // 解决冲突
  public async resolveConflict(filePath: string, resolution: 'mine' | 'theirs' | 'manual'): Promise<boolean> {
    if (!this.vcsProvider) {
      return false;
    }
    return this.vcsProvider.resolveConflict(filePath, resolution);
  }

  // 检测当前工作区的版本控制系统类型
  public async detectVcsType(): Promise<VcsType> {
    const defaultVcs = this.configManager.get<string>('defaultVCS', 'auto');
    const autoDetect = this.configManager.get<boolean>('autoDetect', true);

    // 如果不自动检测，直接使用默认设置
    if (!autoDetect && defaultVcs !== 'auto') {
      this.currentVcsType = defaultVcs as VcsType;
      await this.initializeProvider();
      return this.currentVcsType;
    }

    // 获取工作区文件夹
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      this.currentVcsType = VcsType.NONE;
      this.vcsProvider = null;
      return this.currentVcsType;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    // 检测是否为 Git 仓库
    if (fs.existsSync(path.join(rootPath, '.git'))) {
      this.currentVcsType = VcsType.GIT;
    }
    // 检测是否为 SVN 仓库
    else if (fs.existsSync(path.join(rootPath, '.svn'))) {
      this.currentVcsType = VcsType.SVN;
    }
    // 如果设置了默认值且不是 auto，则使用默认值
    else if (defaultVcs !== 'auto') {
      this.currentVcsType = defaultVcs as VcsType;
    }
    // 否则无法确定版本控制系统
    else {
      this.currentVcsType = VcsType.NONE;
    }

    await this.initializeProvider();
    return this.currentVcsType;
  }

  // 初始化对应的版本控制系统提供者
  private async initializeProvider(): Promise<void> {
    switch (this.currentVcsType) {
      case VcsType.SVN:
        if (!this.svnProvider) {
          this.svnProvider = new SvnProvider(this.configManager);
        }
        this.vcsProvider = this.svnProvider;
        break;
      case VcsType.GIT:
        if (!this.gitProvider) {
          this.gitProvider = new GitProvider(this.configManager);
        }
        this.vcsProvider = this.gitProvider;
        break;
      default:
        this.vcsProvider = null;
        break;
    }

    // 初始化提供者
    if (this.vcsProvider) {
      await this.vcsProvider.initialize();
    }
  }

  // 手动设置版本控制系统类型
  public async setVcsType(type: VcsType): Promise<void> {
    this.currentVcsType = type;
    await this.initializeProvider();
  }

  // 获取当前分支/版本信息
  public async getCurrentBranch(): Promise<string> {
    if (!this.vcsProvider) {
      return '';
    }
    return await this.vcsProvider.getCurrentBranch();
  }

  // 获取变更文件列表
  public async getChangedFiles(): Promise<string[]> {
    if (!this.vcsProvider) {
      return [];
    }
    return await this.vcsProvider.getChangedFiles();
  }

  // 执行提交操作
  public async commit(message: string, files?: string[]): Promise<boolean> {
    if (!this.vcsProvider) {
      vscode.window.showErrorMessage('未检测到支持的版本控制系统');
      return false;
    }
    return await this.vcsProvider.commit(message, files);
  }

  // 执行更新/拉取操作
  public async update(): Promise<boolean> {
    if (!this.vcsProvider) {
      vscode.window.showErrorMessage('未检测到支持的版本控制系统');
      return false;
    }
    return await this.vcsProvider.update();
  }

  // 查看历史记录
  public async viewHistory(filePath?: string): Promise<void> {
    if (!this.vcsProvider) {
      vscode.window.showErrorMessage('未检测到支持的版本控制系统');
      return;
    }
    await this.vcsProvider.viewHistory(filePath);
  }

  // 获取文件diff信息
  public async getFileDiff(filePath: string): Promise<string> {
    if (!this.vcsProvider) {
      return '';
    }
    return await this.vcsProvider.getFileDiff(filePath);
  }

  // 批量获取文件diff信息
  public async getFilesDiff(filePaths: string[]): Promise<Map<string, string>> {
    if (!this.vcsProvider) {
      return new Map();
    }
    return await this.vcsProvider.getFilesDiff(filePaths);
  }
}