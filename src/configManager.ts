import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
// 动态导入 keytar 以避免在 Web 环境中的问题
let keytar: any;
let keytarAvailable = false;
try {
  keytar = require('keytar');
  keytarAvailable = true;
  console.log('✅ keytar 模块加载成功，将使用系统密钥存储');
} catch (error: any) {
  // keytar 是可选依赖，如果加载失败，将使用 VSCode 的 SecretStorage
  // 这在某些环境下是正常的（如 Web 环境或 keytar 未正确安装）
  keytarAvailable = false;
  const errorMsg = error?.message || String(error);
  // 只在调试模式下显示详细错误信息
  if (errorMsg.includes('Cannot find module')) {
    console.log('ℹ️ keytar 模块未找到，将使用 VSCode SecretStorage（这是正常的，功能不受影响）');
  } else {
    console.log(`ℹ️ keytar 模块加载失败，将使用 VSCode SecretStorage: ${errorMsg.substring(0, 100)}`);
  }
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
    if (keytarAvailable && keytar) {
      try {
        await keytar.setPassword(this.SERVICE_NAME, account, password);
        return;
      } catch (error) {
        // 如果 keytar 操作失败，回退到 VSCode SecretStorage
        console.log('keytar 保存失败，回退到 VSCode SecretStorage');
      }
    }
    // 使用 VSCode 的 SecretStorage（更可靠，支持所有平台）
    await this.context.secrets.store(`${this.SERVICE_NAME}.${account}`, password);
  }

  // 获取凭证
  public async getCredential(account: string): Promise<string | null> {
    if (keytarAvailable && keytar) {
      try {
        const password = await keytar.getPassword(this.SERVICE_NAME, account);
        if (password) {
          return password;
        }
      } catch (error) {
        // 如果 keytar 操作失败，回退到 VSCode SecretStorage
        console.log('keytar 读取失败，回退到 VSCode SecretStorage');
      }
    }
    // 使用 VSCode 的 SecretStorage（更可靠，支持所有平台）
    return await this.context.secrets.get(`${this.SERVICE_NAME}.${account}`) || null;
  }

  // 删除凭证
  public async deleteCredential(account: string): Promise<boolean> {
    if (keytarAvailable && keytar) {
      try {
        return await keytar.deletePassword(this.SERVICE_NAME, account);
      } catch (error) {
        // 如果 keytar 操作失败，回退到 VSCode SecretStorage
        console.log('keytar 删除失败，回退到 VSCode SecretStorage');
      }
    }
    // 使用 VSCode 的 SecretStorage（更可靠，支持所有平台）
    await this.context.secrets.delete(`${this.SERVICE_NAME}.${account}`);
    return true;
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