import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { suite, test } from 'mocha';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('开始运行测试');

  test('插件应该被正确激活', async () => {
    const extension = vscode.extensions.getExtension('svn-vscode');
    assert.ok(extension);
    
    if (extension) {
      await extension.activate();
      assert.strictEqual(extension.isActive, true);
    }
  });

  test('应该注册所有命令', () => {
    return vscode.commands.getCommands(true).then((commands: string[]) => {
      const ourCommands = [
        'svn-vscode.commit',
        'svn-vscode.update',
        'svn-vscode.viewHistory',
        'svn-vscode.showMenu',
        'svn-vscode.showBranchInfo',
        'svn-vscode.resolveConflict',
        'svn-vscode.openSettings',
        'svn-vscode.toggleAutoCommit'
      ];
      
      const foundCommands = commands.filter((cmd: string) => ourCommands.includes(cmd));
      assert.strictEqual(foundCommands.length, ourCommands.length, '应该注册所有命令');
    });
  });
});