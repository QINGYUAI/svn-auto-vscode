import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
// 动态导入 keytar 以避免在 Web 环境中的问题
let keytar: any;
try {
  keytar = require('keytar');
} catch (error) {
  console.warn('keytar 模块加载失败，将使用内存存储:', error);
}

// 配置管理器类，负责处理全局和项目级配置
export class ConfigManager {
  private context: vscode.ExtensionContext;
  private config: vscode.WorkspaceConfiguration;
  private projectConfig: any = {};
  private readonly SERVICE_NAME = 'vscode-svn-auto-commit';
  private readonly PROJECT_CONFIG_FILE = '.svn-auto-commit.json';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = vscode.workspace.getConfiguration('svn-auto-commit');
    this.loadProjectConfig();
  }

  // 重新加载配置
  public reloadConfig(): void {
    this.config = vscode.workspace.getConfiguration('svn-auto-commit');
    this.loadProjectConfig();
  }

  // 更新配置
  public update(section: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Thenable<void> {
    return this.config.update(section, value, target);
  }

  // 加载项目级配置
  private loadProjectConfig(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    for (const folder of workspaceFolders) {
      const configPath = path.join(folder.uri.fsPath, this.PROJECT_CONFIG_FILE);
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8');
          this.projectConfig = JSON.parse(configContent);
          console.log('已加载项目配置:', configPath);
          break;
        } catch (error) {
          console.error('加载项目配置失败:', error);
        }
      }
    }
  }

  // 获取配置值，优先使用项目级配置
  public get<T>(key: string, defaultValue?: T): T {
    const keyParts = key.split('.');
    
    // 尝试从项目配置获取
    if (this.projectConfig) {
      let value = this.projectConfig;
      for (const part of keyParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      if (value !== undefined) {
        return value as T;
      }
    }
    
    // 从全局配置获取
    return this.config.get<T>(key, defaultValue as T);
  }

  // 设置配置值
  public async set(key: string, value: any): Promise<void> {
    await this.config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  // 保存凭证
  public async saveCredential(account: string, password: string): Promise<void> {
    if (keytar) {
      await keytar.setPassword(this.SERVICE_NAME, account, password);
    } else {
      // 如果 keytar 不可用，使用 VSCode 的 SecretStorage
      await this.context.secrets.store(`${this.SERVICE_NAME}.${account}`, password);
    }
  }

  // 获取凭证
  public async getCredential(account: string): Promise<string | null> {
    if (keytar) {
      return await keytar.getPassword(this.SERVICE_NAME, account);
    } else {
      // 如果 keytar 不可用，使用 VSCode 的 SecretStorage
      return await this.context.secrets.get(`${this.SERVICE_NAME}.${account}`) || null;
    }
  }

  // 删除凭证
  public async deleteCredential(account: string): Promise<boolean> {
    if (keytar) {
      return await keytar.deletePassword(this.SERVICE_NAME, account);
    } else {
      // 如果 keytar 不可用，使用 VSCode 的 SecretStorage
      await this.context.secrets.delete(`${this.SERVICE_NAME}.${account}`);
      return true;
    }
  }

  // 创建或更新项目级配置文件
  public async saveProjectConfig(config: any): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return false;
    }

    const configPath = path.join(workspaceFolders[0].uri.fsPath, this.PROJECT_CONFIG_FILE);
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      this.projectConfig = config;
      return true;
    } catch (error) {
      console.error('保存项目配置失败:', error);
      return false;
    }
  }
}