# 🔐 Personal Access Token 设置指南

本文档详细说明如何正确创建和配置 Personal Access Token (PAT) 用于发布 VSCode 扩展。

## ⚠️ 重要提示

**Token 是敏感信息，请妥善保管！**
- ❌ 不要将 Token 提交到 Git 仓库
- ❌ 不要分享给他人
- ✅ 保存在安全的地方
- ✅ Token 泄露后立即撤销并重新创建

---

## 📋 前置条件

### 1. 确认 Publisher 名称

在创建 Token 之前，需要确认你的 Publisher 名称：

1. 打开 `package.json` 文件
2. 查看 `publisher` 字段的值
3. 记录这个名称（例如：`QINGYUAI` 或 `2321135061`）

**重要**：Azure DevOps 组织名称必须与 Publisher 名称完全一致（区分大小写）！

### 2. 访问 Azure DevOps

确保你已经：
- ✅ 有 Microsoft 账户
- ✅ 已登录 Azure DevOps
- ✅ 创建了组织（如果没有，需要先创建）

---

## 🔧 创建 Personal Access Token

### 步骤 1: 访问 Token 管理页面

1. 访问 Azure DevOps：https://dev.azure.com

2. 登录你的账户

3. 访问 Token 创建页面：
   ```
   https://dev.azure.com/{组织名称}/_usersSettings/tokens
   ```
   
   **示例**：
   - 如果组织名称是 `2321135061`：
     ```
     https://dev.azure.com/2321135061/_usersSettings/tokens
     ```
   - 如果组织名称是 `QINGYUAI`：
     ```
     https://dev.azure.com/QINGYUAI/_usersSettings/tokens
     ```

### 步骤 2: 创建新 Token

1. 点击 **"+ New Token"** 或 **"New Token"** 按钮

2. 填写 Token 信息：
   - **Name**: `VSCode Extension Publishing`（或任意描述性名称）
   - **Organization**: 选择你的组织（**必须与 publisher 名称一致**）
   - **Expiration**: 
     - 建议选择 **1 年**（365 days）
     - 不要选择 "Never"（某些组织不允许）
   - **Scopes**: 选择 **"Custom defined"**（不要选择 "Full access"）

### 步骤 3: 设置权限（关键步骤）

这是最容易出错的地方！

1. 展开 **"Scopes"** 部分

2. 找到 **"Marketplace"** 部分（可能需要向下滚动）

3. **必须勾选以下权限**：
   ```
   ☑ Marketplace (Manage)          # 必需：发布和管理扩展
   ☑ User Profile (Read)           # 推荐：查看用户信息
   ☑ Organization (Read)           # 推荐：查看组织信息
   ```
   
   **Marketplace: Manage 是发布扩展的必需权限！**

4. **如果遇到 "View user permissions" 错误**：
   - 勾选 **"User Profile: Read"** 权限
   - 或选择 **"Full access"**（如果组织允许）

5. 其他权限可以保持默认或最小化

### 步骤 4: 创建并保存 Token

1. 点击 **"Create"** 按钮

2. **立即复制 Token**（只显示一次！）
   - Token 格式类似：`YOUR_TOKEN_HERE_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - 长度通常为 52-80 个字符
   - **注意**：上面的示例仅用于说明格式，请使用你实际创建的 Token

3. **保存到安全的地方**：
   - 密码管理器（推荐）
   - 加密文件
   - 不要保存在纯文本文件中

---

## 🔑 使用 Token 登录

### 方法一：使用 vsce 命令（推荐）

```bash
# 使用组织名称登录
vsce login {组织名称}

# 示例：
vsce login 2321135061
# 或
vsce login QINGYUAI
```

然后粘贴你的 Token（不会显示在屏幕上，这是正常的）。

### 方法二：使用环境变量

```bash
# Windows PowerShell
$env:VSCE_PAT="你的Token"

# Windows CMD
set VSCE_PAT=你的Token

# Linux/Mac
export VSCE_PAT="你的Token"
```

---

## ✅ 验证登录

登录成功后，可以验证：

```bash
# 检查是否已登录
vsce ls

# 或尝试打包（不需要实际发布）
vsce package --dry-run
```

---

## 🐛 常见错误和解决方案

### 错误 1: TF400813 - 用户未授权

**错误信息**：
```
TF400813: The user is not authorized to access this resource.
```

**原因**：
- Token 没有 `Marketplace: Manage` 权限
- 组织名称与 Publisher 不匹配
- Token 已过期或被撤销

**解决方案**：
1. **检查 Token 权限**：
   - 访问：https://dev.azure.com/{组织名称}/_usersSettings/tokens
   - 找到你的 Token
   - 检查是否有 `Marketplace: Manage` 权限
   - 如果没有，删除旧 Token 并重新创建

2. **验证组织名称**：
   - 检查 `package.json` 中的 `publisher` 字段
   - 确保 Azure DevOps 组织名称与 Publisher 完全一致
   - 区分大小写！

3. **重新创建 Token**：
   - 删除旧的 Token
   - 按照上述步骤重新创建
   - **确保勾选 Marketplace: Manage 权限**

### 错误 1.1: Access Denied - View user permissions

**错误信息**：
```
Access Denied: ... needs the following permission(s) on the resource /{组织名称} to perform this action: View user permissions on a resource
```

**原因**：
- Token 缺少 `User Profile: Read` 权限
- 这是 vsce 验证用户身份所需的权限

**解决方案**：
1. **重新创建 Token 并添加权限**：
   - 访问：https://dev.azure.com/{组织名称}/_usersSettings/tokens
   - 删除旧 Token
   - 创建新 Token
   - **必须勾选以下权限**：
     ```
     ☑ Marketplace (Manage)
     ☑ User Profile (Read)        # 新增：解决此错误
     ☑ Organization (Read)         # 推荐：查看组织信息
     ```

2. **或使用 Full access**（如果组织允许）：
   - 创建 Token 时选择 "Full access"
   - 这会自动包含所有必要权限

3. **重新登录**：
   ```bash
   vsce login {组织名称}
   # 输入新创建的 Token
   ```

### 错误 2: 组织名称不匹配

**问题**：`package.json` 中的 publisher 与 Azure DevOps 组织名称不一致

**解决方案**：

**选项 A：更新 package.json**（如果组织名称是正确的）
```json
{
  "publisher": "2321135061"  // 改为你的组织名称
}
```

**选项 B：创建匹配的组织**（如果 publisher 是正确的）
1. 在 Azure DevOps 创建新组织，名称与 publisher 一致
2. 使用新组织创建 Token

### 错误 3: Token 已过期

**解决方案**：
1. 访问 Token 管理页面
2. 创建新的 Token
3. 使用新 Token 重新登录

### 错误 4: 找不到组织

**问题**：访问 https://dev.azure.com/{组织名称} 时显示 404

**解决方案**：
1. 确认组织名称拼写正确
2. 确认你已加入该组织
3. 尝试访问：https://dev.azure.com 查看所有组织

---

## 📝 检查清单

创建 Token 前，请确认：

- [ ] 已确认 `package.json` 中的 `publisher` 名称
- [ ] 已确认 Azure DevOps 组织名称
- [ ] 组织名称与 Publisher 名称一致（区分大小写）
- [ ] Token 设置了 `Marketplace: Manage` 权限
- [ ] Token 有效期设置合理（建议 1 年）
- [ ] Token 已安全保存
- [ ] 已使用 `vsce login` 成功登录

---

## 🔄 更新 Token

如果需要更新 Token：

1. **创建新 Token**（按照上述步骤）

2. **重新登录**：
   ```bash
   vsce login {组织名称}
   # 输入新 Token
   ```

3. **删除旧 Token**（可选，但推荐）：
   - 访问 Token 管理页面
   - 找到旧 Token
   - 点击删除

---

## 📞 获取帮助

如果仍然遇到问题：

1. **检查官方文档**：
   - [vsce 文档](https://github.com/microsoft/vscode-vsce)
   - [VSCode 扩展发布指南](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

2. **常见问题**：
   - 确保 Token 有正确的权限
   - 确保组织名称匹配
   - 确保 Token 未过期

3. **提交 Issue**：
   - [GitHub Issues](https://github.com/QINGYUAI/svn-auto-vscode/issues)

---

## 🔗 相关链接

- **Azure DevOps**: https://dev.azure.com
- **Token 管理页面**: https://dev.azure.com/{组织名称}/_usersSettings/tokens
- **VSCode Marketplace 管理**: https://marketplace.visualstudio.com/manage
- **vsce 工具**: https://github.com/microsoft/vscode-vsce

---

**最后更新**: 2025-11-20  
**文档版本**: 1.0

