const path = require('path');

const config = {
  target: 'node', // VSCode 扩展运行在 Node.js 环境中
  mode: 'none', // 让 VSCode 扩展主机决定优化级别
  node: {
    __dirname: false,
    __filename: false,
  },
  
  entry: './src/extension.ts', // 扩展的入口点
  output: {
    // 打包后的文件将放在 'dist' 文件夹中
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode', // vscode 模块由 VSCode 提供，不需要打包
    keytar: 'commonjs keytar'  // keytar 是原生模块，不能打包
  },
  resolve: {
    // 支持读取 TypeScript 和 JavaScript 文件
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // 启用问题匹配器的日志记录
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'source-map';
  }
  return config;
};