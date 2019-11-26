// import helloWorld from './feature/hello-world';
import jumpToDefinition from './feature/jump-to-definition';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import {provideDefinition} from './feature/jump-to-definition';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('恭喜，您的扩展“vscode-plugin-demo”已被激活！');
	console.log(vscode);
	// helloWorld(context);
	jumpToDefinition(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
