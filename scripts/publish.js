#!/usr/bin/env node

/**
 * 发布脚本
 * 用于发布 VSCode 扩展到 Marketplace
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

// 确认发布
function confirmPublish() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n⚠️  确定要发布到 VSCode Marketplace 吗？(yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// 检查 Git 状态
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('\n⚠️  有未提交的更改:', 'yellow');
      log(status, 'yellow');
      return false;
    }
    return true;
  } catch (error) {
    log('⚠️  无法检查 Git 状态', 'yellow');
    return true; // 继续执行
  }
}

// 主函数
async function main() {
  log('\n🚀 发布 VSCode 扩展到 Marketplace...', 'blue');
  
  // 检查 vsce
  if (!checkVsce()) {
    log('❌ vsce 未安装', 'red');
    log('请运行: npm install -g @vscode/vsce', 'yellow');
    process.exit(1);
  }
  
  // 检查 Git 状态
  if (!checkGitStatus()) {
    log('\n⚠️  建议先提交所有更改', 'yellow');
  }
  
  // 显示版本信息
  const version = getVersion();
  log(`\n版本: ${version}`, 'magenta');
  
  // 确认发布
  const confirmed = await confirmPublish();
  if (!confirmed) {
    log('❌ 已取消发布', 'yellow');
    process.exit(0);
  }
  
  // 发布
  log('\n📤 发布到 Marketplace...', 'blue');
  if (!exec('vsce publish')) {
    log('❌ 发布失败', 'red');
    log('\n常见问题:', 'yellow');
    log('1. 检查是否已登录: vsce login QINGYUAI', 'yellow');
    log('2. 检查 Personal Access Token 是否有效', 'yellow');
    log('3. 检查版本号是否已存在', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ 发布成功！', 'green');
  log(`\n插件市场链接:`, 'cyan');
  log(`https://marketplace.visualstudio.com/items?itemName=QINGYUAI.svn-git-auto-commit`, 'cyan');
  log(`\n管理控制台:`, 'cyan');
  log(`https://marketplace.visualstudio.com/manage/publishers/QINGYUAI/extensions/svn-git-auto-commit/hub`, 'cyan');
}

main();

