# 📝 创建 Publisher 指南

如果遇到权限错误，可能需要先在 VSCode Marketplace 中创建 Publisher。

## 🔍 检查是否需要创建 Publisher

### 方法 1: 使用 vsce 命令检查

```bash
# 检查 Token 权限
vsce verify-pat 2321135061

# 列出已登录的 Publishers
vsce ls-publishers
```

### 方法 2: 访问 Marketplace 管理页面

访问：https://marketplace.visualstudio.com/manage/publishers

如果看不到 `2321135061`，需要创建。

---

## 🚀 创建 Publisher

### 步骤 1: 访问创建页面

访问：https://marketplace.visualstudio.com/manage/create-publisher

### 步骤 2: 填写 Publisher 信息

- **Publisher ID**: `2321135061`
  - 必须与 `package.json` 中的 `publisher` 字段完全一致
  - 只能包含小写字母、数字和连字符
  - 不能包含空格或特殊字符

- **Display Name**: `QINGYUAI`（或你想要的显示名称）
  - 这是在 Marketplace 中显示的名称
  - 可以包含空格和特殊字符

- **Description**: 可选，描述你的 Publisher

### 步骤 3: 验证和创建

1. 阅读并同意服务条款
2. 点击 **"Create"** 创建 Publisher

---

## ✅ 创建后验证

创建 Publisher 后：

1. **验证 Publisher 存在**：
   - 访问：https://marketplace.visualstudio.com/manage/publishers
   - 应该能看到 `2321135061`

2. **重新创建 Token**（确保权限正确）：
   - 访问：https://dev.azure.com/2321135061/_usersSettings/tokens
   - 创建新 Token，勾选：
     - Marketplace: Manage ✅
     - User Profile: Read ✅
     - Organization: Read ✅

3. **使用新 Token 登录**：
   ```bash
   vsce login 2321135061
   # 粘贴新 Token
   ```

---

## 🔧 如果仍然失败

### 检查清单

- [ ] Publisher 已创建
- [ ] Token 有 Marketplace: Manage 权限
- [ ] Token 有 User Profile: Read 权限
- [ ] `package.json` 中的 `publisher` 与创建的名称一致
- [ ] Azure DevOps 组织名称与 Publisher ID 一致

### 常见问题

**Q: Publisher ID 已被占用怎么办？**
A: 需要选择另一个唯一的 ID，或联系 Marketplace 支持。

**Q: 创建 Publisher 后仍然无法登录？**
A: 确保 Token 权限正确，特别是 `User Profile: Read` 权限。

**Q: 可以使用邮箱作为 Publisher ID 吗？**
A: 可以，但建议使用简短易记的 ID。

---

## 🔗 相关链接

- [创建 Publisher](https://marketplace.visualstudio.com/manage/create-publisher)
- [管理 Publishers](https://marketplace.visualstudio.com/manage/publishers)
- [Token 设置指南](./Token设置指南.md)
- [权限错误解决方案](./权限错误解决方案.md)

---

**最后更新**: 2025-11-20

