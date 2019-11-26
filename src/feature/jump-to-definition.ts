/**
 * 跳转到跳转到定义示例，支持alias路径跳转
 */

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as util from "../util";

const aliasBasePath: string = vscode.workspace.getConfiguration().get('vscodePluginAlias.basePath') || '';
const aliasPathConfig: { [key: string]: string } = vscode.workspace.getConfiguration().get('vscodePluginAlias.path') || {};

function provideDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
): vscode.ProviderResult<
  vscode.Location | vscode.Location[] | vscode.LocationLink[]
> {
  const fileName = document.fileName;
  const workDir = path.dirname(fileName);
  const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position);
  const projectPath = util.getProjectPath(document);

  console.log("====== 进入 provideDefinition 方法 ======");
  console.log("fileName: " + fileName); // 当前文件名
  console.log("workDir: " + workDir); // 当前文件所在目录
  console.log("word: " + word); // 当前光标所在单词
  console.log("line: " + line.text); // 当前光标所在行
  console.log("projectPath: " + projectPath); // 当前工程目录
  console.log("========================================");

  const aliasWordList = (line.text.match(/['|"](.*?)\/(.*)['|"]/) || []);
  const aliasPath = getAliasPath(aliasWordList[1]);
  let destPath = '';
  if (aliasPath) {
    destPath = path.join(aliasBasePath, aliasPath, aliasWordList[2]);
  } else {
    destPath = path.join(workDir, 'node_modules', aliasWordList[1], aliasWordList[2]);
  }

  if (!path.extname(destPath)) {
    destPath += '.js'
  }
  if (fs.existsSync(destPath)) {
    // const position = util.findStrInFile(destPath, word) || [];
    return new vscode.Location(
      vscode.Uri.file(destPath),
      new vscode.Position(0, 0)
      // new vscode.Position(position.row, position.col)
    );
  }
}

function provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
  const fileName = document.fileName;
  const workDir = path.dirname(fileName);
  const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position);

  console.log('进入provideHover方法');
  const aliasWordList = (line.text.match(/['|"](.*?)\/(.*)['|"]/) || []);
  const aliasPath = getAliasPath(aliasWordList[1]);
  if (aliasPath) {
    const destPath = path.join(aliasBasePath, aliasPath, aliasWordList[2]);
    return new vscode.Hover(`**module** \`"${destPath}"\``);
  } 
}

export default (context: vscode.ExtensionContext): void => {
  // 注册如何实现跳转到定义，第一个参数表示仅对json文件生效
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(['javascript', 'vue', 'json'], {
      provideDefinition
    })
  );
  context.subscriptions.push(vscode.languages.registerHoverProvider(['javascript', 'vue', 'json'], {
    provideHover
  }));
};

function getAliasPath(aliasKey: string): string {
  return aliasPathConfig[aliasKey] || '';
}
