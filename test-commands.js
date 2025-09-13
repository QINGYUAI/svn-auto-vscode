// 测试命令注册的简单脚本
// 在 VSCode 开发者工具的 Console 中运行

console.log('=== SVN/Git 自动提交插件命令测试 ===');

// 测试命令是否存在
const commands = [
  'svn-auto-commit.commit',
  'svn-auto-commit.update', 
  'svn-auto-commit.viewHistory',
  'svn-auto-commit.showMenu',
  'svn-auto-commit.showBranchInfo',
  'svn-auto-commit.resolveConflict',
  'svn-auto-commit.openSettings',
  'svn-auto-commit.autoCommit',
  'svn-auto-commit.setupSvnAuth'
];

// 获取所有已注册的命令
vscode.commands.getCommands(true).then(allCommands => {
  console.log('总共注册的命令数量:', allCommands.length);
  
  console.log('\n=== 检查插件命令 ===');
  commands.forEach(cmd => {
    const exists = allCommands.includes(cmd);
    console.log(`${exists ? '✅' : '❌'} ${cmd}: ${exists ? '已注册' : '未找到'}`);
  });
  
  // 显示所有包含 svn-auto-commit 的命令
  const pluginCommands = allCommands.filter(cmd => cmd.includes('svn-auto-commit'));
  console.log('\n=== 插件相关命令 ===');
  pluginCommands.forEach(cmd => {
    console.log('✅', cmd);
  });
  
  if (pluginCommands.length === 0) {
    console.log('❌ 没有找到任何插件命令！');
    console.log('请检查插件是否正确安装和激活');
  }
});

// 测试命令执行
console.log('\n=== 测试命令执行 ===');
vscode.commands.executeCommand('svn-auto-commit.showMenu')
  .then(() => {
    console.log('✅ svn-auto-commit.showMenu 命令执行成功');
  })
  .catch(error => {
    console.log('❌ svn-auto-commit.showMenu 命令执行失败:', error.message);
  });
