#!/usr/bin/env node

/**
 * 构建脚本
 * 用于编译和打包 VSCode 扩展
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

// 检查必要文件
function checkFiles() {
  log('\n📋 检查必要文件...', 'blue');
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'webpack.config.js',
    'src/extension.ts',
    'icon.png'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log(`❌ 缺少必要文件: ${missingFiles.join(', ')}`, 'red');
    return false;
  }
  
  log('✅ 所有必要文件存在', 'green');
  return true;
}

// 读取版本号
function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

// 主函数
function main() {
  log('\n🚀 开始构建 VSCode 扩展...', 'blue');
  log(`版本: ${getVersion()}`, 'yellow');
  
  // 检查文件
  if (!checkFiles()) {
    process.exit(1);
  }
  
  // 运行 ESLint
  log('\n🔍 运行代码检查...', 'blue');
  if (!exec('npm run lint')) {
    log('⚠️  代码检查有警告，但继续构建...', 'yellow');
  }
  
  // 编译项目
  log('\n📦 编译项目...', 'blue');
  if (!exec('npm run package')) {
    log('❌ 编译失败', 'red');
    process.exit(1);
  }
  
  // 检查编译输出
  if (!fs.existsSync('dist/extension.js')) {
    log('❌ 编译输出文件不存在: dist/extension.js', 'red');
    process.exit(1);
  }
  
  log('\n✅ 构建完成！', 'green');
  log(`输出文件: dist/extension.js`, 'cyan');
  log(`版本: ${getVersion()}`, 'cyan');
}

main();

