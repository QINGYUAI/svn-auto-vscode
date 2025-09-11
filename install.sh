#!/bin/bash

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}开始安装 SVN/Git 自动提交插件依赖...${NC}"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 npm，请先安装 npm${NC}"
    exit 1
fi

# 安装依赖
echo -e "${YELLOW}正在安装依赖...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}依赖安装失败，请检查错误信息${NC}"
    exit 1
fi

# 编译插件
echo -e "${YELLOW}正在编译插件...${NC}"
npm run compile

if [ $? -ne 0 ]; then
    echo -e "${RED}插件编译失败，请检查错误信息${NC}"
    exit 1
fi

# 打包插件
echo -e "${YELLOW}正在打包插件...${NC}"
npm run package

if [ $? -ne 0 ]; then
    echo -e "${RED}插件打包失败，请检查错误信息${NC}"
    exit 1
fi

echo -e "${GREEN}安装完成！${NC}"
echo -e "${YELLOW}您可以通过以下方式在 VS Code 中测试此插件:${NC}"
echo -e "1. 按 F5 启动调试会话"
echo -e "2. 或者运行 'code --install-extension svn-vscode-0.0.1.vsix' 安装打包后的插件"

exit 0