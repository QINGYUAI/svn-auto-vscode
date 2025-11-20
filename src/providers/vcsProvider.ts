import * as vscode from 'vscode';

// 版本控制系统提供者接口
export interface VcsProvider {
  // 初始化提供者
  initialize(): Promise<void>;
  
  // 获取当前分支/版本信息
  getCurrentBranch(): Promise<string>;
  
  // 获取变更文件列表
  getChangedFiles(): Promise<string[]>;
  
  // 执行提交操作
  commit(message: string, files?: string[]): Promise<boolean>;
  
  // 执行更新/拉取操作
  update(): Promise<boolean>;
  
  // 查看历史记录
  viewHistory(filePath?: string): Promise<void>;
  
  // 解决冲突
  resolveConflict(filePath: string, resolution: 'mine' | 'theirs' | 'manual'): Promise<boolean>;
  
  // 检查是否有冲突
  hasConflicts(): Promise<boolean>;
  
  // 获取冲突文件列表
  getConflictFiles(): Promise<string[]>;
  
  // 获取文件diff信息
  getFileDiff(filePath: string): Promise<string>;
  
  // 批量获取文件diff信息
  getFilesDiff(filePaths: string[]): Promise<Map<string, string>>;
}