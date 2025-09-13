#!/bin/bash

echo "🔧 SVN/Git 自动提交插件 - 安装和测试脚本"
echo "================================================"

# 检查 VSCode 是否安装
if ! command -v code &> /dev/null; then
    echo "❌ VSCode 命令行工具未找到"
    echo "请确保 VSCode 已安装并添加到 PATH"
    exit 1
fi

echo "✅ VSCode 命令行工具已找到"

# 检查 VSIX 文件
VSIX_FILE="svn-git-auto-commit-0.1.0.vsix"
if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ VSIX 文件未找到: $VSIX_FILE"
    exit 1
fi

echo "✅ VSIX 文件已找到: $VSIX_FILE"

# 卸载旧版本
echo ""
echo "🗑️  卸载旧版本..."
code --uninstall-extension svn-git-auto-commit 2>/dev/null || true

# 安装新版本
echo ""
echo "📦 安装新版本..."
code --install-extension "$VSIX_FILE" --force

if [ $? -eq 0 ]; then
    echo "✅ 插件安装成功"
else
    echo "❌ 插件安装失败"
    exit 1
fi

# 验证安装
echo ""
echo "🔍 验证安装..."
INSTALLED=$(code --list-extensions | grep -i svn)
if [ -n "$INSTALLED" ]; then
    echo "✅ 插件已安装: $INSTALLED"
else
    echo "❌ 插件未在已安装列表中找到"
fi

echo ""
echo "🚀 安装完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 重启 VSCode"
echo "2. 打开一个包含 .git 或 .svn 的项目"
echo "3. 按 F12 打开开发者工具"
echo "4. 在 Console 中查看插件激活日志"
echo "5. 测试命令: Ctrl+Shift+P -> 'SVN/Git 自动提交'"
echo ""
echo "🐛 如果仍有问题："
echo "- 查看开发者工具 Console 中的错误信息"
echo "- 运行测试脚本: 在 Console 中粘贴 test-commands.js 的内容"
echo "- 检查 INSTALL_DEBUG.md 中的详细说明"
