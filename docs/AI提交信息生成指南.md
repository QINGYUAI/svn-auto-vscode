# AI提交信息生成指南

## 📖 简介

SVN/Git 自动提交插件现已支持AI自动生成提交信息功能。通过集成AI服务，插件可以分析代码变更并自动生成符合规范的提交信息。

## ✨ 功能特性

- 🤖 **智能分析**：自动分析代码变更内容，理解代码意图
- 📝 **中文生成**：生成符合Conventional Commits规范的中文提交信息
- 🔒 **安全存储**：API密钥安全存储在VSCode密钥管理器中
- 🔌 **多服务支持**：支持OpenAI、Claude、Gemini、通义千问、文心一言、DeepSeek、Moonshot和自定义API服务
- ⚡ **快速生成**：一键生成提交信息，提升开发效率

## 🚀 快速开始

### 1. 启用AI功能

在VSCode设置中启用AI功能：

```json
{
  "svn-auto-commit.ai.enabled": true
}
```

### 2. 配置AI服务提供商

#### 方式一：使用OpenAI

```json
{
  "svn-auto-commit.ai.provider": "openai",
  "svn-auto-commit.ai.openai.model": "gpt-3.5-turbo",
  "svn-auto-commit.ai.openai.apiUrl": "https://api.openai.com/v1/chat/completions"
}
```

#### 方式二：使用Claude

```json
{
  "svn-auto-commit.ai.provider": "claude",
  "svn-auto-commit.ai.claude.model": "claude-3-sonnet-20240229",
  "svn-auto-commit.ai.claude.apiUrl": "https://api.anthropic.com/v1/messages"
}
```

#### 方式三：使用Gemini

```json
{
  "svn-auto-commit.ai.provider": "gemini",
  "svn-auto-commit.ai.gemini.model": "gemini-pro"
}
```

#### 方式四：使用通义千问

```json
{
  "svn-auto-commit.ai.provider": "qwen",
  "svn-auto-commit.ai.qwen.model": "qwen-turbo"
}
```

#### 方式五：使用文心一言

```json
{
  "svn-auto-commit.ai.provider": "ernie",
  "svn-auto-commit.ai.ernie.model": "ernie-bot"
}
```

#### 方式六：使用DeepSeek

```json
{
  "svn-auto-commit.ai.provider": "deepseek",
  "svn-auto-commit.ai.deepseek.model": "deepseek-chat"
}
```

#### 方式七：使用Moonshot

```json
{
  "svn-auto-commit.ai.provider": "moonshot",
  "svn-auto-commit.ai.moonshot.model": "moonshot-v1-8k"
}
```

#### 方式八：使用自定义API

```json
{
  "svn-auto-commit.ai.provider": "custom",
  "svn-auto-commit.ai.custom.apiUrl": "https://your-api-endpoint.com/v1/generate",
  "svn-auto-commit.ai.custom.method": "POST",
  "svn-auto-commit.ai.custom.requestBody": "{\"prompt\": {prompt}, \"max_tokens\": 100}",
  "svn-auto-commit.ai.custom.authHeader": "Authorization",
  "svn-auto-commit.ai.custom.authPrefix": "Bearer ",
  "svn-auto-commit.ai.custom.responsePath": "choices.0.message.content"
}
```

### 3. 设置API密钥

#### 方法一：通过命令设置（推荐）

1. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) 打开命令面板
2. 输入 `SVN/Git 自动提交: 设置AI API密钥`
3. 选择AI服务提供商（已配置密钥的会显示✓标记）
4. 如果已配置密钥，可以选择：
   - **重新设置密钥**：更新API密钥
   - **删除密钥**：删除已保存的密钥
5. 输入API密钥

**智能特性**：
- ✅ 已配置密钥的AI会显示✓标记，方便识别
- ✅ 设置密钥后会自动切换到该AI服务
- ✅ 如果配置的AI没有密钥，会自动使用其他有密钥的AI（需启用`ai.autoSelect`）

API密钥将安全存储在VSCode密钥管理器中。

#### 方法二：通过配置文件设置

```json
{
  "svn-auto-commit.ai.openai.apiKey": "your-api-key-here"
}
```

⚠️ **注意**：不推荐在配置文件中直接存储API密钥，建议使用命令设置方式。

## 📋 配置选项

### AI基础配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.enabled` | boolean | `false` | 是否启用AI功能 |
| `ai.autoSelect` | boolean | `true` | 是否自动选择有密钥的AI服务（如果配置的AI没有密钥，会自动使用其他有密钥的AI） |
| `ai.provider` | string | `openai` | AI服务提供商 (`openai`, `claude`, `gemini`, `qwen`, `ernie`, `deepseek`, `moonshot`, `custom`) |

### OpenAI配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.openai.apiKey` | string | `""` | OpenAI API密钥 |
| `ai.openai.model` | string | `gpt-3.5-turbo` | 使用的模型名称 |
| `ai.openai.apiUrl` | string | `https://api.openai.com/v1/chat/completions` | API地址 |

### Claude配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.claude.apiKey` | string | `""` | Claude API密钥 |
| `ai.claude.model` | string | `claude-3-sonnet-20240229` | 使用的模型名称 |
| `ai.claude.apiUrl` | string | `https://api.anthropic.com/v1/messages` | API地址 |

### Gemini配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.gemini.apiKey` | string | `""` | Gemini API密钥 |
| `ai.gemini.model` | string | `gemini-pro` | 使用的模型名称 |
| `ai.gemini.apiUrl` | string | `""` | API地址（留空使用默认） |

### 通义千问配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.qwen.apiKey` | string | `""` | 通义千问API密钥 |
| `ai.qwen.model` | string | `qwen-turbo` | 使用的模型名称 |
| `ai.qwen.apiUrl` | string | `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation` | API地址 |

### 文心一言配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.ernie.apiKey` | string | `""` | 文心一言API密钥/access_token |
| `ai.ernie.model` | string | `ernie-bot` | 使用的模型名称 |
| `ai.ernie.apiUrl` | string | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions` | API地址 |

### DeepSeek配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.deepseek.apiKey` | string | `""` | DeepSeek API密钥 |
| `ai.deepseek.model` | string | `deepseek-chat` | 使用的模型名称 |
| `ai.deepseek.apiUrl` | string | `https://api.deepseek.com/v1/chat/completions` | API地址 |

### Moonshot配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.moonshot.apiKey` | string | `""` | Moonshot API密钥 |
| `ai.moonshot.model` | string | `moonshot-v1-8k` | 使用的模型名称 |
| `ai.moonshot.apiUrl` | string | `https://api.moonshot.cn/v1/chat/completions` | API地址 |

### 自定义API配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ai.custom.apiUrl` | string | `""` | 自定义API地址 |
| `ai.custom.method` | string | `POST` | 请求方法 (`GET`, `POST`, `PUT`) |
| `ai.custom.requestBody` | string | `""` | 请求体模板（JSON格式，使用`{prompt}`占位符） |
| `ai.custom.authHeader` | string | `Authorization` | 认证头字段名 |
| `ai.custom.authPrefix` | string | `Bearer ` | 认证前缀 |
| `ai.custom.responsePath` | string | `""` | 响应路径（点号分隔，如`choices.0.message.content`） |

## 🎯 使用方法

### 基本使用

1. **修改代码文件**
2. **执行提交操作**
   - 按 `Ctrl+Alt+V` (Mac: `Cmd+Alt+V`) 快捷键
   - 或使用命令面板：`SVN/Git 自动提交: 提交更改`
3. **选择要提交的文件**
4. **AI自动生成提交信息**
   - 如果启用了AI功能，插件会自动分析代码变更并生成提交信息
   - 生成的提交信息会显示在输入框中，您可以编辑或直接使用

### 工作流程

```
修改代码 → 执行提交 → 选择文件 → AI分析diff → 生成提交信息 → 确认提交
```

## 🔧 高级配置

### 自定义提示词

AI生成器会根据以下信息生成提交信息：

- 变更文件列表
- 文件diff内容
- 文件类型和变更模式

生成的提交信息遵循Conventional Commits规范，格式如：

```
feat: 添加用户登录功能
fix: 修复登录验证bug
docs: 更新API文档
```

### 限制diff长度

为了避免超出API的token限制，插件会自动限制diff内容的长度：

- 单个文件diff最大长度：2000字符
- 总diff内容最大长度：3000字符

超过限制的内容会被截断。

## 🐛 故障排除

### 问题1：AI生成失败

**可能原因：**
- API密钥未配置或配置错误
- 网络连接问题
- API服务不可用

**解决方法：**
1. 检查API密钥是否正确设置
2. 检查网络连接
3. 查看VSCode输出面板的错误信息

### 问题2：生成的提交信息不符合预期

**解决方法：**
1. 可以手动编辑生成的提交信息
2. 如果AI生成失败，会自动回退到模板生成方式

### 问题3：API调用超时

**解决方法：**
1. 检查网络连接
2. 减少变更文件数量
3. 检查API服务状态

## 💡 最佳实践

1. **API密钥安全**：使用命令设置API密钥，避免在配置文件中明文存储
2. **多AI配置**：可以配置多个AI服务的密钥，插件会自动使用有密钥的AI
3. **自动切换**：启用`ai.autoSelect`后，如果配置的AI没有密钥，会自动使用其他有密钥的AI
4. **合理使用**：AI生成适合大多数场景，但对于重要提交建议手动编写
5. **检查生成内容**：提交前检查AI生成的提交信息，确保准确描述变更内容
6. **网络环境**：确保网络连接稳定，避免API调用失败

## 🔄 智能AI选择

插件支持智能AI选择功能：

### 自动检测和使用

当启用`ai.autoSelect`（默认启用）时：
- 优先使用配置的AI服务（`ai.provider`）
- 如果配置的AI没有密钥，自动检测并使用其他有密钥的AI
- 自动切换到找到的AI服务

### 手动选择

如果禁用`ai.autoSelect`：
- 只使用配置的AI服务（`ai.provider`）
- 如果配置的AI没有密钥，不会自动切换，直接使用模板生成

### 配置示例

```json
{
  "svn-auto-commit.ai.enabled": true,
  "svn-auto-commit.ai.autoSelect": true,
  "svn-auto-commit.ai.provider": "openai"
}
```

这样配置后，如果OpenAI没有密钥，会自动使用其他有密钥的AI（如Claude、通义千问等）。

## 📝 示例

### 示例1：功能添加

**代码变更：**
```typescript
// 新增文件：src/auth.ts
export function login(username: string, password: string) {
  // 登录逻辑
}
```

**AI生成：**
```
feat: 添加用户登录功能
```

### 示例2：Bug修复

**代码变更：**
```typescript
// 修复：src/utils.ts
- if (value === null) {
+ if (value === null || value === undefined) {
```

**AI生成：**
```
fix: 修复空值判断逻辑
```

### 示例3：文档更新

**代码变更：**
```markdown
// 更新：docs/README.md
+ 添加了新的API使用说明
```

**AI生成：**
```
docs: 更新API使用文档
```

## 🔗 相关文档

- [用户指南](用户指南.md)
- [配置说明](使用文档.md)
- [故障排除指南](故障排除指南.md)

## 📄 许可证

本功能遵循MIT许可证。

