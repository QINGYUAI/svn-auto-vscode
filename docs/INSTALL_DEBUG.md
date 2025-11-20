# 🔧 调试版本安装和测试指南

## 📦 新的调试版本

已创建带有详细调试信息的版本：`svn-git-auto-commit-debug.vsix`

### 🔍 主要修复

1. **激活事件优化**：使用 `"*"` 确保插件在 VSCode 启动时立即激活
2. **详细调试日志**：添加了完整的命令注册跟踪
3. **正确的生命周期管理**：确保所有管理器正确注册到 VSCode 订阅系统

## 🚀 安装步骤

### 1. 卸载旧版本
```bash
# 卸载之前的版本
code --uninstall-extension svn-git-auto-commit
```

### 2. 安装调试版本
```bash
# 安装新的调试版本
code --install-extension svn-git-auto-commit-debug.vsix --force
```

### 3. 重启 VSCode
完全关闭并重新打开 VSCode

## 🔍 调试步骤

### 1. 检查插件激活
1. 打开 VSCode 开发者工具：`Help` → `Toggle Developer Tools`
2. 在 Console 中查找以下日志：
   ```
   SVN/Git 自动提交插件已激活
   Extension context: /path/to/extension
   Workspace folders: X
   CommandManager: 开始注册命令
   注册命令: svn-auto-commit.commit
   ...
   CommandManager: 所有命令注册完成，总计: X 个命令
   命令管理器已添加到订阅，当前订阅数量: X
   ```

### 2. 验证命令注册
打开命令面板 (`Ctrl+Shift+P` 或 `Cmd+Shift+P`)，搜索：
- `SVN/Git 自动提交: 提交更改`
- `SVN/Git 自动提交: 更新/拉取`
- `SVN/Git 自动提交: 查看历史`
- `SVN/Git 自动提交: 显示操作菜单`
- `SVN/Git 自动提交: 设置SVN认证`

### 3. 测试快捷键
- `Ctrl+Alt+V` (Mac: `Cmd+Alt+V`) - 提交更改
- `Ctrl+Alt+U` (Mac: `Cmd+Alt+U`) - 更新/拉取
- `Ctrl+Alt+H` (Mac: `Cmd+Alt+H`) - 查看历史
- `Ctrl+Alt+M` (Mac: `Cmd+Alt+M`) - 显示菜单

### 4. 检查状态栏
查看 VSCode 底部状态栏是否显示：
- SVN 或 Git 图标
- 分支信息
- 操作按钮

## 🐛 如果仍然出现问题

### 方法1：检查插件列表
```bash
# 列出所有已安装的插件
code --list-extensions --show-versions | grep svn
```

### 方法2：手动激活插件
1. 打开命令面板
2. 输入 `Developer: Reload Window`
3. 重新加载窗口

### 方法3：检查工作区
确保在一个包含 `.git` 或 `.svn` 文件夹的项目中测试

### 方法4：开发者模式测试
```bash
# 在项目目录中
cd /Users/qingyuai/Desktop/web/svn-vscode
code .
# 按 F5 启动调试模式
```

## 📋 测试清单

- [ ] 插件成功安装
- [ ] 开发者工具中看到激活日志
- [ ] 命令面板中找到所有命令
- [ ] 快捷键正常工作
- [ ] 状态栏显示正常
- [ ] 右键菜单有相关选项
- [ ] SVN 认证设置功能可用
- [ ] 上下文感知提交功能正常

## 🔧 关于事件监听器警告

`[Violation] Added non-passive event listener to a scroll-blocking 'touchstart' event` 警告通常来自：

1. **VSCode 本身**：这可能是 VSCode 内部的警告，不是插件代码导致的
2. **浏览器环境**：如果在 VSCode Web 版本中运行
3. **第三方依赖**：某些 Node.js 模块可能包含此类代码

**解决方案**：
- 这个警告通常不影响插件功能
- 如果需要修复，可以在浏览器设置中忽略此类警告
- 或者在 VSCode 设置中调整相关配置

## 📞 获取帮助

如果问题仍然存在，请提供：
1. VSCode 版本信息
2. 操作系统信息
3. 开发者工具中的完整日志
4. 具体的错误信息截图
