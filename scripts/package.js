#!/usr/bin/env node

/**
 * 打包脚本
 * 用于将 VSCode 扩展打包成 VSIX 文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    log(`执行: ${command}`, 'cyan');
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`错误: ${command}`, 'red');
    return false;
  }
}

// 检查 vsce 是否安装
function checkVsce() {
  try {
    execSync('vsce --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// 读取版本号
function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

// 查找 VSIX 文件
function findVsixFile() {
  const files = fs.readdirSync('.');
  return files.find(file => file.endsWith('.vsix') && file.includes('svn-git-auto-commit'));
}

// 获取文件大小
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2); // KB
}

// 主函数
function main() {
  log('\n📦 开始打包 VSCode 扩展...', 'blue');
  
  // 检查 vsce
  if (!checkVsce()) {
    log('❌ vsce 未安装', 'red');
    log('请运行: npm install -g @vscode/vsce', 'yellow');
    log('或使用: npx @vscode/vsce package', 'yellow');
    process.exit(1);
  }
  
  // 检查编译输出
  if (!fs.existsSync('dist/extension.js')) {
    log('⚠️  dist/extension.js 不存在，先执行构建...', 'yellow');
    if (!exec('node scripts/build.js')) {
      log('❌ 构建失败', 'red');
      process.exit(1);
    }
  }
  
  // 创建 release 目录
  if (!fs.existsSync('release')) {
    fs.mkdirSync('release');
  }
  
  // 打包
  log('\n📦 打包 VSIX 文件...', 'blue');
  const version = getVersion();
  const outputPath = `release/svn-git-auto-commit-${version}.vsix`;
  
  if (!exec(`vsce package -o ${outputPath}`)) {
    log('❌ 打包失败', 'red');
    process.exit(1);
  }
  
  // 检查输出文件
  const vsixFile = findVsixFile();
  if (vsixFile && fs.existsSync(vsixFile)) {
    const size = getFileSize(vsixFile);
    log('\n✅ 打包完成！', 'green');
    log(`文件: ${vsixFile}`, 'cyan');
    log(`大小: ${size} KB`, 'cyan');
    log(`版本: ${version}`, 'cyan');
    
    // 如果文件在根目录，移动到 release 目录
    if (!vsixFile.startsWith('release/')) {
      const targetPath = path.join('release', vsixFile);
      fs.renameSync(vsixFile, targetPath);
      log(`已移动到: ${targetPath}`, 'cyan');
    }
  } else {
    log('⚠️  未找到 VSIX 文件', 'yellow');
  }
}

main();

