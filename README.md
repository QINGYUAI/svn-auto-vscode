# SVN/Git 自动提交 VSCode 插件

<p align="center">
  <img src="https://img.shields.io/badge/VSCode-Extension-blue?style=flat-square&logo=visual-studio-code" alt="VSCode Extension">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-0.1.0-orange?style=flat-square" alt="Version">
</p>

## 🚀 简介

一个强大的 VSCode 插件，为开发者提供便捷的版本控制自动化解决方案。支持 SVN 和 Git 双版本控制系统，通过智能化的提交流程和丰富的配置选项，显著提升代码提交效率。

## ✨ 核心特性

### 🔄 双版本控制系统支持
- ✅ **智能检测**：自动识别项目使用的版本控制系统
- ✅ **SVN 支持**：完整的 SVN 操作支持，包括更新、提交、冲突解决
- ✅ **Git 支持**：全面的 Git 功能，支持拉取、推送、分支管理

### ⚡ 快速操作
- 🎯 **一键提交**：`Ctrl+Alt+V` (Mac: `Cmd+Alt+V`) 快速提交
- 📊 **状态栏集成**：实时显示版本控制状态和快捷操作
- 🎛️ **命令面板**：完整的命令支持，操作更便捷

### 🤖 自动化功能
- 🔍 **文件监控**：实时监控工作区文件变化
- ⏰ **延迟提交**：可配置延迟时间，避免频繁提交
- 🚫 **智能忽略**：支持自定义忽略模式，排除不必要的文件

### 📝 提交信息管理
- 📋 **模板系统**：支持自定义提交信息模板
- 🔤 **变量替换**：日期、时间、用户名、文件列表等动态变量
- ✅ **信息验证**：可配置的提交信息格式验证

### 🛠️ 冲突解决
- 🔍 **冲突检测**：自动检测版本冲突
- 🎯 **解决选项**：提供多种冲突解决方案
- 📖 **手动合并**：支持打开文件进行手动合并

## 📦 安装方法

### 方法一：VSCode 插件市场（推荐）
1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开插件市场
3. 搜索 "SVN/Git 自动提交"
4. 点击安装

### 方法二：VSIX 文件安装
1. 下载 `svn-git-auto-commit-0.1.0.vsix` 文件
2. 在 VSCode 中按 `Ctrl+Shift+P`
3. 输入 `Extensions: Install from VSIX...`
4. 选择下载的 VSIX 文件

## 🎯 快速开始

### 1. 基本使用
```bash
# 提交代码
Ctrl+Alt+V (Mac: Cmd+Alt+V)

# 或点击状态栏的提交图标
# 或使用命令面板：SVN/Git 自动提交: 提交更改
```

### 2. 状态栏说明
| 图标 | 功能 | 操作 |
|------|------|------|
| `$(source-control) SVN/Git` | 版本控制系统 | 点击显示菜单 |
| `$(git-branch) 分支名` | 当前分支 | 点击显示分支信息 |
| `$(sync)` | 更新/拉取 | 点击执行更新 |
| `$(git-commit) [数字]` | 提交（变更文件数） | 点击执行提交 |
| `$(history)` | 历史记录 | 点击查看历史 |

### 3. 基础配置
```json
{
  "svn-auto-commit.enabled": true,
  "svn-auto-commit.showStatusBar": true,
  "svn-auto-commit.confirmBeforeCommit": true,
  "svn-auto-commit.commit.template": "[修复] {message} - {username} ({date})"
}
```

## 📚 文档

- 📖 [详细使用文档](./使用文档.md) - 完整的功能说明和配置指南
- ⚡ [快速入门指南](./快速入门.md) - 5分钟快速上手
- 🔧 [故障排除指南](./故障排除指南.md) - 常见问题解决方案
- ⚙️ [配置示例](./配置示例.json) - 完整的配置参考

## 🎨 功能演示

### 提交流程
1. 修改文件后，状态栏显示变更文件数量
2. 按 `Ctrl+Alt+V` 或点击提交图标
3. 选择要提交的文件
4. 输入或确认提交信息
5. 自动执行提交操作

### 自动提交
```json
{
  "svn-auto-commit.autoCommit.enabled": true,
  "svn-auto-commit.autoCommit.delay": 60,
  "svn-auto-commit.autoCommit.messageTemplate": "自动提交: {fileList} ({datetime})"
}
```

## 🔧 系统要求

- **VSCode**: 1.73.0 或更高版本
- **Node.js**: 16.0 或更高版本
- **Git**: 2.0 或更高版本（Git 项目）
- **SVN**: 1.7 或更高版本（SVN 项目）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

<p align="center">
  <strong>如果这个插件对你有帮助，请给个 ⭐ Star 支持一下！</strong>
</p>