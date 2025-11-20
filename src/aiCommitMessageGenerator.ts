import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { ConfigManager } from './configManager';

/**
 * AI提交信息生成器
 * 使用AI API自动生成提交信息
 */
export class AiCommitMessageGenerator {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * 生成AI提交信息
   * @param files 变更文件列表
   * @param diffs 文件diff信息映射（文件路径 -> diff内容）
   * @returns 生成的提交信息，如果失败则返回null
   */
  public async generateCommitMessage(
    files: string[],
    diffs: Map<string, string>
  ): Promise<string | null> {
    try {
      // 检查是否启用AI功能
      const aiEnabled = this.configManager.get<boolean>('ai.enabled', false);
      if (!aiEnabled) {
        return null;
      }

      // 获取可用的AI提供商（优先使用配置的，如果没有密钥则自动检测）
      const configuredProvider = this.configManager.get<string>('ai.provider', 'openai');
      const autoSelect = this.configManager.get<boolean>('ai.autoSelect', true);
      let aiProvider = configuredProvider;
      let apiKey = await this.getApiKey(configuredProvider);
      
      // 如果配置的AI没有密钥且启用了自动选择，自动检测其他有密钥的AI
      if (!apiKey && autoSelect) {
        const availableProvider = await this.findAvailableProvider();
        if (availableProvider) {
          aiProvider = availableProvider;
          apiKey = await this.getApiKey(availableProvider);
          // 自动切换到有密钥的AI
          await this.configManager.update('ai.provider', availableProvider);
          console.log(`自动切换到有密钥的AI: ${availableProvider}`);
        } else {
          // 不显示警告，静默失败，让用户使用模板生成
          console.log('没有找到已配置密钥的AI服务，跳过AI生成');
          return null;
        }
      } else if (!apiKey) {
        // 如果禁用了自动选择且配置的AI没有密钥，直接返回
        console.log(`配置的AI服务(${configuredProvider})没有密钥，跳过AI生成`);
        return null;
      }

      // 确保有API密钥
      if (!apiKey) {
        console.log('没有找到可用的AI API密钥');
        return null;
      }

      // 构建提示词
      const prompt = this.buildPrompt(files, diffs);

      // 根据提供商调用不同的API
      return await this.callAI(aiProvider, apiKey, prompt);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('AI生成提交信息失败:', errorMessage);
      
      // 提供更友好的错误提示
      let userMessage = 'AI生成提交信息失败';
      if (errorMessage.includes('404')) {
        userMessage = 'AI API地址不存在(404)，请检查API URL配置是否正确';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage = 'AI API认证失败，请检查API密钥是否正确';
      } else if (errorMessage.includes('超时')) {
        userMessage = 'AI API请求超时，请检查网络连接';
      } else if (errorMessage.includes('未配置')) {
        userMessage = errorMessage;
      } else {
        userMessage = `AI生成失败: ${errorMessage.substring(0, 100)}`;
      }
      
      // 只在控制台显示详细错误，给用户显示简化版本
      vscode.window.showWarningMessage(userMessage);
      return null;
    }
  }

  /**
   * 调用AI API
   */
  private async callAI(provider: string, apiKey: string, prompt: string): Promise<string | null> {
    switch (provider.toLowerCase()) {
      case 'openai':
        return await this.callOpenAI(apiKey, prompt);
      case 'claude':
        return await this.callClaude(apiKey, prompt);
      case 'gemini':
        return await this.callGemini(apiKey, prompt);
      case 'qwen':
      case 'tongyi':
        return await this.callQwen(apiKey, prompt);
      case 'ernie':
      case 'wenxin':
        return await this.callErnie(apiKey, prompt);
      case 'deepseek':
        return await this.callDeepSeek(apiKey, prompt);
      case 'moonshot':
        return await this.callMoonshot(apiKey, prompt);
      case 'custom':
        return await this.callCustomAPI(apiKey, prompt);
      default:
        // 尝试使用自定义API格式
        return await this.callCustomAPI(apiKey, prompt);
    }
  }

  /**
   * 查找有密钥的可用AI提供商
   * @returns 找到的提供商名称，如果没有则返回null
   */
  public async findAvailableProvider(): Promise<string | null> {
    const providers = ['openai', 'claude', 'gemini', 'qwen', 'ernie', 'deepseek', 'moonshot', 'custom'];
    
    for (const provider of providers) {
      const apiKey = await this.getApiKey(provider);
      if (apiKey) {
        return provider;
      }
    }
    
    return null;
  }

  /**
   * 获取所有已配置密钥的AI提供商列表
   */
  public async getAvailableProviders(): Promise<Array<{ name: string; label: string; hasKey: boolean }>> {
    const providers = [
      { name: 'openai', label: 'OpenAI' },
      { name: 'claude', label: 'Claude' },
      { name: 'gemini', label: 'Gemini' },
      { name: 'qwen', label: '通义千问' },
      { name: 'ernie', label: '文心一言' },
      { name: 'deepseek', label: 'DeepSeek' },
      { name: 'moonshot', label: 'Moonshot' },
      { name: 'custom', label: '自定义API' }
    ];

    const result = [];
    for (const provider of providers) {
      const hasKey = !!(await this.getApiKey(provider.name));
      result.push({ ...provider, hasKey });
    }

    return result;
  }

  /**
   * 构建AI提示词
   * @param files 变更文件列表
   * @param diffs 文件diff信息
   * @returns 提示词
   */
  private buildPrompt(files: string[], diffs: Map<string, string>): string {
    const fileList = files.map(f => `- ${f}`).join('\n');
    
    // 构建diff内容（限制长度以避免超出token限制）
    let diffContent = '';
    let totalLength = 0;
    const maxDiffLength = 3000; // 最大diff长度

    for (const [file, diff] of diffs.entries()) {
      if (totalLength + diff.length > maxDiffLength) {
        diffContent += `\n... (其他文件diff已截断)`;
        break;
      }
      diffContent += `\n\n文件: ${file}\n${diff}`;
      totalLength += diff.length;
    }

    return `请根据以下代码变更生成一个简洁的中文Git提交信息。

要求：
1. 使用中文描述
2. 遵循Conventional Commits规范（如：feat: 添加新功能）
3. 简洁明了，不超过50个字
4. 只返回提交信息，不要包含其他说明

变更文件：
${fileList}

代码变更：
${diffContent}

提交信息：`;
  }

  /**
   * 调用OpenAI API
   */
  private async callOpenAI(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.openai.model', 'gpt-3.5-turbo');
    const apiUrl = this.configManager.get<string>('ai.openai.apiUrl', 'https://api.openai.com/v1/chat/completions');
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    };

    return await this.makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.choices?.[0]?.message?.content?.trim() || null;
    });
  }

  /**
   * 调用Claude API
   */
  private async callClaude(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.claude.model', 'claude-3-sonnet-20240229');
    const apiUrl = this.configManager.get<string>('ai.claude.apiUrl', 'https://api.anthropic.com/v1/messages');
    
    const requestBody = {
      model: model,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    return await this.makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.content?.[0]?.text?.trim() || null;
    });
  }

  /**
   * 调用Gemini API
   */
  private async callGemini(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.gemini.model', 'gemini-pro');
    let apiUrl = this.configManager.get<string>('ai.gemini.apiUrl', '');
    
    // 如果未配置URL，使用默认格式
    if (!apiUrl) {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    } else if (!apiUrl.includes('key=')) {
      // 如果配置了URL但没有key参数，添加key参数
      const separator = apiUrl.includes('?') ? '&' : '?';
      apiUrl = `${apiUrl}${separator}key=${apiKey}`;
    }
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7
      }
    };

    return await this.makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    });
  }

  /**
   * 调用通义千问API
   */
  private async callQwen(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.qwen.model', 'qwen-turbo');
    const apiUrl = this.configManager.get<string>('ai.qwen.apiUrl', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation');
    
    const requestBody = {
      model: model,
      input: {
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      parameters: {
        max_tokens: 100,
        temperature: 0.7
      }
    };

    return await this.makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.output?.choices?.[0]?.message?.content?.trim() || null;
    });
  }

  /**
   * 调用文心一言API
   */
  private async callErnie(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.ernie.model', 'ernie-bot');
    const apiUrl = this.configManager.get<string>('ai.ernie.apiUrl', 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions');
    
    const requestBody = {
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_output_tokens: 100,
      temperature: 0.7
    };

    // 文心一言使用access_token，需要从apiKey中提取
    const accessToken = apiKey.includes('access_token=') ? apiKey.split('access_token=')[1] : apiKey;
    const finalUrl = `${apiUrl}?access_token=${accessToken}`;

    return await this.makeHttpRequest(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.result?.trim() || null;
    });
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeek(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.deepseek.model', 'deepseek-chat');
    const apiUrl = this.configManager.get<string>('ai.deepseek.apiUrl', 'https://api.deepseek.com/v1/chat/completions');
    
    const requestBody = {
      model: model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 100,
      temperature: 0.7
    };

    return await this.makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.choices?.[0]?.message?.content?.trim() || null;
    });
  }

  /**
   * 调用Moonshot API
   */
  private async callMoonshot(apiKey: string, prompt: string): Promise<string | null> {
    const model = this.configManager.get<string>('ai.moonshot.model', 'moonshot-v1-8k');
    const apiUrl = this.configManager.get<string>('ai.moonshot.apiUrl', 'https://api.moonshot.cn/v1/chat/completions');
    
    const requestBody = {
      model: model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 100,
      temperature: 0.7
    };

    return await this.makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    }, (response: any) => {
      return response.choices?.[0]?.message?.content?.trim() || null;
    });
  }

  /**
   * 调用自定义API
   */
  private async callCustomAPI(apiKey: string, prompt: string): Promise<string | null> {
    const apiUrl = this.configManager.get<string>('ai.custom.apiUrl', '');
    
    if (!apiUrl || apiUrl.trim() === '') {
      // 如果未配置URL，尝试从provider获取
      const aiProvider = this.configManager.get<string>('ai.provider', 'custom');
      if (aiProvider !== 'custom') {
        console.log(`未找到${aiProvider}的配置，尝试使用自定义API格式`);
        // 返回null，让调用者知道需要配置URL
        return null;
      } else {
        const errorMsg = '自定义API URL未配置。请在设置中配置 "svn-auto-commit.ai.custom.apiUrl"';
        console.error(errorMsg);
        vscode.window.showErrorMessage(errorMsg);
        return null;
      }
    }

    // 获取自定义配置
    const requestMethod = this.configManager.get<string>('ai.custom.method', 'POST');
    const requestBodyTemplate = this.configManager.get<string>('ai.custom.requestBody', '');
    const authHeader = this.configManager.get<string>('ai.custom.authHeader', 'Authorization');
    const authPrefix = this.configManager.get<string>('ai.custom.authPrefix', 'Bearer ');
    const responsePath = this.configManager.get<string>('ai.custom.responsePath', '');

    // 构建请求体
    let requestBody: any;
    if (requestBodyTemplate) {
      // 使用模板替换
      requestBody = JSON.parse(requestBodyTemplate.replace('{prompt}', JSON.stringify(prompt)));
    } else {
      // 默认格式
      requestBody = {
        prompt: prompt,
        max_tokens: 100
      };
    }

    // 构建请求头
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (authHeader && apiKey) {
      headers[authHeader] = authPrefix + apiKey;
    }

    // 构建响应解析器
    const responseParser = (response: any): string | null => {
      if (responsePath) {
        // 使用配置的路径解析
        const paths = responsePath.split('.');
        let result = response;
        for (const path of paths) {
          if (result && typeof result === 'object' && path in result) {
            result = result[path];
          } else {
            return null;
          }
        }
        return typeof result === 'string' ? result.trim() : null;
      } else {
        // 尝试多种可能的字段
        return response.message || response.text || response.content || response.result || 
               response.choices?.[0]?.message?.content || response.data?.text || null;
      }
    };

    return await this.makeHttpRequest(apiUrl || '', {
      method: requestMethod,
      headers: headers,
      body: JSON.stringify(requestBody)
    }, responseParser);
  }

  /**
   * 发送HTTP请求
   */
  private async makeHttpRequest(
    url: string,
    options: { method: string; headers: any; body: string },
    responseParser: (response: any) => string | null
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        // 验证URL格式
        if (!url || url.trim() === '') {
          reject(new Error('API URL未配置或为空'));
          return;
        }

        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: options.method,
          headers: options.headers
        };

        const req = client.request(requestOptions, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                // 尝试解析JSON响应
                let response: any;
                try {
                  response = JSON.parse(data);
                } catch (parseError) {
                  // 如果不是JSON，尝试直接返回文本
                  const textResult = data.trim();
                  if (textResult) {
                    resolve(textResult);
                    return;
                  }
                  reject(new Error(`无法解析API响应: ${data.substring(0, 200)}`));
                  return;
                }

                const result = responseParser(response);
                if (!result) {
                  // 如果解析失败，尝试从响应中提取有用信息
                  const errorMsg = response.error?.message || response.message || '未知错误';
                  reject(new Error(`API响应解析失败: ${errorMsg}。响应: ${JSON.stringify(response).substring(0, 200)}`));
                } else {
                  resolve(result);
                }
              } else {
                // 尝试解析错误响应
                let errorMessage = `API请求失败 (${res.statusCode})`;
                try {
                  const errorResponse = JSON.parse(data);
                  errorMessage += `: ${errorResponse.error?.message || errorResponse.message || data.substring(0, 200)}`;
                } catch {
                  errorMessage += `: ${data.substring(0, 200)}`;
                }
                errorMessage += `\n请求URL: ${url}`;
                reject(new Error(errorMessage));
              }
            } catch (error: any) {
              reject(new Error(`解析响应失败: ${error.message || error}。响应数据: ${data.substring(0, 200)}`));
            }
          });
        });

        req.on('error', (error: any) => {
          reject(new Error(`网络请求失败: ${error.message || error}。URL: ${url}`));
        });

        // 设置超时
        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error(`请求超时 (30秒)。URL: ${url}`));
        });

        req.write(options.body);
        req.end();
      } catch (error: any) {
        reject(new Error(`构建请求失败: ${error.message || error}。URL: ${url}`));
      }
    });
  }

  /**
   * 获取API密钥
   * @param provider AI提供商名称，如果不提供则使用配置的提供商
   */
  private async getApiKey(provider?: string): Promise<string | null> {
    const aiProvider = provider || this.configManager.get<string>('ai.provider', 'openai');
    
    // 优先从安全存储获取（更安全）
    let apiKey = await this.configManager.getCredential(`ai-${aiProvider}-apikey`) || '';
    
    // 如果安全存储中没有，尝试从配置中获取
    if (!apiKey) {
      apiKey = this.configManager.get<string>(`ai.${aiProvider}.apiKey`, '');
    }
    
    return apiKey || null;
  }

  /**
   * 保存API密钥到安全存储
   * @param provider AI提供商名称
   * @param apiKey API密钥
   */
  public async saveApiKey(provider: string, apiKey: string): Promise<void> {
    await this.configManager.saveCredential(`ai-${provider}-apikey`, apiKey);
  }
}

