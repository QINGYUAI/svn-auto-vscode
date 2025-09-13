import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import { TestFunction } from 'mocha';

export async function run(): Promise<void> {
  // 创建 mocha 测试
  const mocha = new Mocha({
    ui: 'tdd',
    color: true
  });

  const testsRoot = path.resolve(__dirname, '..');

  try {
    // 使用新版本 glob 的 Promise API
    const files = await glob('**/**.test.js', { cwd: testsRoot });
    
    // 添加文件到测试套件
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((c, e) => {
      try {
        // 运行测试
        mocha.run((failures: number) => {
          if (failures > 0) {
            e(new Error(`${failures} 个测试失败`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  } catch (err) {
    throw new Error(`查找测试文件失败: ${err}`);
  }
}