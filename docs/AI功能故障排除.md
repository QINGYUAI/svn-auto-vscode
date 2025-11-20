# AI功能故障排除指南

## 🔍 常见错误及解决方案

### 错误1: API请求失败 404

**错误信息**：
```
ERR [Extension Host] AI生成提交信息失败: Error: API请求失败: 404 -
```

**原因分析**：
- API URL配置不正确或不存在
- 自定义API的URL格式错误
- API端点路径错误

**解决方案**：

#### 1. 检查API URL配置

打开VSCode设置，检查对应AI服务的API URL：

**OpenAI**:
```json
{
  "svn-auto-commit.ai.provider": "openai",
  "svn-auto-commit.ai.openai.apiUrl": "https://api.openai.com/v1/chat/completions"
}
```

**Claude**:
```json
{
  "svn-auto-commit.ai.provider": "claude",
  "svn-auto-commit.ai.claude.apiUrl": "https://api.anthropic.com/v1/messages"
}
```

**自定义API**:
```json
{
  "svn-auto-commit.ai.provider": "custom",
  "svn-auto-commit.ai.custom.apiUrl": "https://your-api-endpoint.com/v1/chat"
}
```

#### 2. 验证API URL格式

确保API URL：
- ✅ 包含完整的协议（`https://` 或 `http://`）
- ✅ 包含正确的域名和路径
- ✅ 没有多余的空格或特殊字符

#### 3. 测试API连接

可以使用curl或Postman测试API是否可访问：

```bash
# 测试OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# 测试自定义API
curl https://your-api-endpoint.com/v1/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"prompt": "test"}'
```

### 错误2: API认证失败 401/403

**错误信息**：
```
API请求失败: 401 - Unauthorized
API请求失败: 403 - Forbidden
```

**原因分析**：
- API密钥无效或已过期
- API密钥格式不正确
- 认证头配置错误

**解决方案**：

1. **检查API密钥**：
   - 确认API密钥是否正确
   - 确认API密钥是否已过期
   - 确认API密钥是否有足够的权限

2. **重新设置API密钥**：
   - 命令面板 → `SVN/Git 自动提交: 设置AI API密钥`
   - 选择对应的AI服务
   - 重新输入正确的API密钥

3. **检查认证配置**（自定义API）：
   ```json
   {
     "svn-auto-commit.ai.custom.authHeader": "Authorization",
     "svn-auto-commit.ai.custom.authPrefix": "Bearer "
   }
   ```

### 错误3: 请求超时

**错误信息**：
```
请求超时 (30秒)
```

**原因分析**：
- 网络连接不稳定
- API服务器响应慢
- 防火墙或代理设置问题

**解决方案**：

1. **检查网络连接**
2. **检查防火墙设置**
3. **检查代理配置**（如果使用代理）

### 错误4: 响应解析失败

**错误信息**：
```
API响应解析失败: ...
解析响应失败: ...
```

**原因分析**：
- API返回格式与预期不符
- 响应路径配置错误（自定义API）
- API返回了错误信息

**解决方案**：

#### 对于自定义API：

1. **检查响应路径配置**：
   ```json
   {
     "svn-auto-commit.ai.custom.responsePath": "choices.0.message.content"
   }
   ```
   根据实际API响应格式调整路径。

2. **检查请求体模板**：
   ```json
   {
     "svn-auto-commit.ai.custom.requestBody": "{\"messages\": [{\"role\": \"user\", \"content\": {prompt}}]}"
   }
   ```
   确保使用`{prompt}`占位符。

3. **查看API文档**：
   - 确认API的请求格式
   - 确认API的响应格式
   - 确认认证方式

### 错误5: 没有找到已配置密钥的AI服务

**错误信息**：
```
没有找到已配置密钥的AI服务，跳过AI生成
```

**原因分析**：
- 所有AI服务都没有配置密钥
- API密钥配置失败

**解决方案**：

1. **配置至少一个AI服务的密钥**：
   - 命令面板 → `SVN/Git 自动提交: 设置AI API密钥`
   - 选择任意一个AI服务
   - 输入API密钥

2. **检查密钥是否保存成功**：
   - 重新打开设置命令
   - 查看已配置的AI是否显示✓标记

## 🔧 调试技巧

### 1. 查看详细日志

打开VSCode的输出面板：
1. 按 `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`)
2. 选择 "Log (Extension Host)"
3. 查看详细的错误信息

### 2. 检查配置

使用命令面板检查当前配置：
```
Ctrl+Shift+P → Preferences: Open Settings (JSON)
```

查看所有AI相关配置：
```json
{
  "svn-auto-commit.ai.enabled": true,
  "svn-auto-commit.ai.provider": "openai",
  "svn-auto-commit.ai.autoSelect": true,
  "svn-auto-commit.ai.openai.apiUrl": "...",
  "svn-auto-commit.ai.openai.model": "..."
}
```

### 3. 测试单个AI服务

1. 禁用自动选择：
   ```json
   {
     "svn-auto-commit.ai.autoSelect": false,
     "svn-auto-commit.ai.provider": "openai"
   }
   ```
2. 确保只配置一个AI的密钥
3. 测试提交功能

## 📋 检查清单

在报告问题前，请确认：

- [ ] AI功能已启用 (`ai.enabled: true`)
- [ ] 至少配置了一个AI服务的API密钥
- [ ] API URL配置正确
- [ ] API密钥有效且未过期
- [ ] 网络连接正常
- [ ] 查看过输出面板的详细错误信息

## 💡 最佳实践

1. **优先使用官方API**：OpenAI、Claude等官方API更稳定
2. **使用安全存储**：通过命令设置API密钥，不要直接写在配置文件中
3. **测试连接**：配置后先测试一次，确保API可访问
4. **查看日志**：遇到问题时查看输出面板的详细日志

## 🆘 获取帮助

如果以上方法都无法解决问题：

1. 查看VSCode输出面板的完整错误信息
2. 检查API服务商的文档和状态页面
3. 在GitHub Issues中报告问题，附上：
   - 错误信息
   - 配置信息（隐藏API密钥）
   - 输出面板的日志

