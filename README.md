# SVN/Git 自动提交 VSCode 插件

<p align="center">
  <img src="https://img.shields.io/visual-studio-marketplace/v/QINGYUAI.svn-git-auto-commit?style=flat-square&logo=visual-studio-code" alt="VSCode Extension">
  <img src="https://img.shields.io/visual-studio-marketplace/d/QINGYUAI.svn-git-auto-commit?style=flat-square" alt="Downloads">
  <img src="https://img.shields.io/visual-studio-marketplace/i/QINGYUAI.svn-git-auto-commit?style=flat-square" alt="Installs">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

<p align="center">
  <strong>🚀 一个强大的 VSCode 插件，为开发者提供便捷的版本控制自动化解决方案</strong>
</p>

## 📖 简介

支持 SVN 和 Git 双版本控制系统，通过智能化的提交流程和丰富的配置选项，显著提升代码提交效率。无论您是使用传统的 SVN 还是现代的 Git，都能享受到一致的自动化体验。

## 📚 文档导航

| 文档 | 描述 | 适用人群 |
|------|------|----------|
| [用户指南](docs/用户指南.md) | 完整的安装、配置、使用说明和故障排除指南 | 所有用户 |
| [开发文档](docs/开发文档.md) | 技术架构、开发指南和贡献说明 | 开发者 |
| [需求规格](docs/需求规格.md) | 详细的功能需求和技术规格说明 | 产品经理、开发者 |
| [发布文档](docs/发布文档.md) | 版本更新历史和发布信息 | 所有用户 |

## ✨ 核心特性

### 🔄 双版本控制系统支持
- ✅ **智能检测**：自动识别项目使用的版本控制系统（SVN/Git）
- ✅ **SVN 支持**：完整的 SVN 操作支持，包括更新、提交、冲突解决
- ✅ **Git 支持**：全面的 Git 功能，支持拉取、推送、分支管理

### ⚡ 快速操作
- 🎯 **一键提交**：`Ctrl+Alt+V` (Mac: `Cmd+Alt+V`) 快速提交
- 📊 **状态栏集成**：实时显示版本控制状态和快捷操作
- 🎛️ **命令面板**：完整的命令支持，操作更便捷
- 🖱️ **右键菜单**：在文件资源管理器中快速访问功能

### 🤖 智能自动化
- 🔍 **文件监控**：实时监控工作区文件变化
- ⏰ **延迟提交**：可配置延迟时间，避免频繁提交
- 🚫 **智能忽略**：支持自定义忽略模式，排除不必要的文件
- 🎯 **上下文感知**：根据当前编辑的文件智能选择提交范围
- 🧠 **AI智能生成**：在SCM输入框中一键生成提交信息，支持多种AI服务

### 📝 提交信息管理
- 📋 **模板系统**：支持自定义提交信息模板
- 🔤 **变量替换**：支持 `{date}`, `{time}`, `{username}`, `{fileList}` 等动态变量
- ✅ **信息验证**：可配置的提交信息格式验证
- 🏷️ **前缀支持**：支持 Conventional Commits 规范
- 🤖 **AI智能生成**：集成多种AI服务，自动生成高质量的提交信息

## 📦 安装方法

### 方法一：VSCode 插件市场（推荐）
1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开插件市场
3. 搜索 "SVN/Git 自动提交" 或 "QINGYUAI"
4. 点击安装

### 方法二：命令行安装
```bash
code --install-extension QINGYUAI.svn-git-auto-commit
```

### 方法三：VSIX 文件安装
1. 从 [GitHub Releases](https://github.com/QINGYUAI/svn-auto-vscode/releases) 下载最新的 VSIX 文件
2. 在 VSCode 中按 `Ctrl+Shift+P`
3. 输入 `Extensions: Install from VSIX...`
4. 选择下载的 VSIX 文件

## 🎯 快速开始

### 1. 基本使用

```bash
# 快捷键提交
Ctrl+Alt+V (Windows/Linux)
Cmd+Alt+V (Mac)

# 或者使用命令面板
Ctrl+Shift+P → "SVN/Git 自动提交: 提交更改"

# 或者点击状态栏图标
```

### 2. 状态栏功能

| 图标 | 功能 | 操作 |
|------|------|------|
| `$(source-control) SVN/Git` | 版本控制系统指示器 | 点击显示操作菜单 |
| `$(git-branch) 分支名` | 当前分支信息 | 点击显示分支详情 |
| `$(sync)` | 更新/拉取操作 | 点击执行更新 |
| `$(git-commit) [数字]` | 提交（显示变更文件数） | 点击执行提交 |
| `$(history)` | 历史记录 | 点击查看提交历史 |

### 3. 使用示例

#### 基础提交流程
1. **修改文件**：编辑您的代码文件
2. **查看状态**：状态栏会显示变更文件数量
3. **执行提交**：按 `Ctrl+Alt+V` 或点击提交图标
4. **选择文件**：在弹出的对话框中选择要提交的文件
5. **输入信息**：输入或确认提交信息
6. **完成提交**：插件自动执行提交操作

#### 自动提交配置
```json
{
  "svn-auto-commit.autoCommit.enabled": true,
  "svn-auto-commit.autoCommit.delay": 60,
  "svn-auto-commit.autoCommit.messageTemplate": "自动提交: {fileList} ({datetime})"
}
```

#### 提交信息模板示例
```json
{
  "svn-auto-commit.commit.template": "[{changeType}] {message} - {username} ({date})",
  "svn-auto-commit.commit.validateMessage": true,
  "svn-auto-commit.commit.requirePrefix": true,
  "svn-auto-commit.commit.allowedPrefixes": ["feat", "fix", "docs", "style", "refactor"]
}
```

## ⚙️ 配置选项

### 基础配置
```json
{
  "svn-auto-commit.enabled": true,
  "svn-auto-commit.defaultVCS": "auto",
  "svn-auto-commit.autoDetect": true,
  "svn-auto-commit.showStatusBar": true,
  "svn-auto-commit.confirmBeforeCommit": true
}
```

### SVN 专用配置
```json
{
  "svn-auto-commit.svn.path": "svn",
  "svn-auto-commit.svn.username": "your-username",
  "svn-auto-commit.svn.autoUpdate": true,
  "svn-auto-commit.svn.addUnversioned": false,
  "svn-auto-commit.svn.ignoreExternals": true
}
```

### Git 专用配置
```json
{
  "svn-auto-commit.git.path": "git",
  "svn-auto-commit.git.username": "your-username",
  "svn-auto-commit.git.email": "your-email@example.com",
  "svn-auto-commit.git.autoPull": true,
  "svn-auto-commit.git.autoPush": false,
  "svn-auto-commit.git.addAll": false
}
```

## 🎨 功能演示

### 智能文件选择
- 🎯 **当前文件优先**：在编辑器中提交时自动选择当前文件
- 📁 **目录级提交**：在资源管理器中右键目录可提交整个目录
- 🔍 **变更检测**：只显示实际有变更的文件

### 提交信息智能生成
- 📝 **自动生成**：根据文件变更类型自动生成提交信息
- 🏷️ **标签识别**：自动识别功能类型（新增、修复、重构等）
- 📅 **时间戳**：自动添加时间戳和用户信息

### 冲突处理
- 🔍 **自动检测**：提交前自动检测版本冲突
- 🛠️ **解决选项**：提供多种冲突解决方案
- 📖 **手动合并**：支持打开冲突文件进行手动合并

## 🔧 系统要求

- **VSCode**: 1.73.0 或更高版本
- **Node.js**: 16.0 或更高版本（用于插件运行）
- **Git**: 2.0 或更高版本（Git 项目必需）
- **SVN**: 1.7 或更高版本（SVN 项目必需）

## 🚀 高级功能

### 批量操作
- 📦 **批量提交**：一次性提交多个文件或目录
- 🔄 **批量更新**：同时更新多个项目
- 📋 **操作历史**：记录所有操作历史，支持撤销

### 团队协作
- 👥 **用户管理**：支持多用户配置
- 🔐 **认证管理**：安全的密码存储和管理
- 📊 **统计报告**：提交统计和活动报告

### 自定义扩展
- 🔌 **钩子支持**：提交前后钩子脚本
- 🎨 **主题定制**：自定义状态栏样式
- 📱 **通知设置**：灵活的通知配置

## 🐛 故障排除

### 常见问题

**Q: 插件无法检测到版本控制系统**
A: 请确保项目根目录包含 `.git` 或 `.svn` 文件夹，并检查相关工具是否正确安装。

**Q: 提交时出现权限错误**
A: 请检查 SVN/Git 的用户名和密码配置，确保有足够的权限进行提交操作。

**Q: 自动提交功能不工作**
A: 请检查 `svn-auto-commit.autoCommit.enabled` 设置，并确认延迟时间配置合理。

### 获取帮助
- 📖 查看 [用户指南](docs/用户指南.md) - 完整的使用说明和故障排除
- 🛠️ 查看 [开发文档](docs/开发文档.md) - 技术架构和贡献指南
- 📋 查看 [需求规格](docs/需求规格.md) - 详细的功能需求说明
- 🚀 查看 [发布文档](docs/发布文档.md) - 版本更新和发布信息
- 🐛 提交 [Issue](https://github.com/QINGYUAI/svn-auto-vscode/issues)
- 💬 参与 [讨论](https://github.com/QINGYUAI/svn-auto-vscode/discussions)

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. **Fork** 本项目
2. **创建**功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交**更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送**到分支 (`git push origin feature/AmazingFeature`)
5. **打开** Pull Request

### 开发环境设置
```bash
# 克隆项目
git clone https://github.com/QINGYUAI/svn-auto-vscode.git

# 安装依赖
npm install

# 启动开发模式
npm run watch

# 运行测试
npm test
```

## 📊 统计信息

- 🌟 **GitHub Stars**: [给个 Star 支持一下！](https://github.com/QINGYUAI/svn-auto-vscode)
- 📥 **下载量**: 查看 [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=QINGYUAI.svn-git-auto-commit)
- 🐛 **问题跟踪**: [GitHub Issues](https://github.com/QINGYUAI/svn-auto-vscode/issues)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

特别感谢：
- VSCode 团队提供的优秀开发平台
- 开源社区的支持和反馈
- 所有测试用户的宝贵建议

---

<p align="center">
  <strong>🌟 如果这个插件对你有帮助，请给个 Star 支持一下！</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=QINGYUAI.svn-git-auto-commit">
    <img src="https://img.shields.io/badge/安装插件-VSCode%20Marketplace-blue?style=for-the-badge&logo=visual-studio-code" alt="Install Extension">
  </a>
</p>