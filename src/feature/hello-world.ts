import * as vscode from 'vscode';

const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
  // The code you place here will be executed every time your command is executed
  vscode.window.showInformationMessage('Hello world');
  // Display a message box to the user
});

export default (context: vscode.ExtensionContext):void => {
  // 注册如何实现跳转到定义，第一个参数表示仅对json文件生效
  context.subscriptions.push(disposable);
};

