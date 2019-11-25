/**
 * 跳转到跳转到定义示例，支持alias路径跳转
 */

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as util from "../util";

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

  if (/\/package\.json$/.test(fileName)) {
    console.log(word, line.text);
    const json = document.getText();
    // 这里我们偷懒只做一个简单的正则匹配
    if (
      new RegExp(
        `"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(
          /\//g,
          "\\/"
        )}[\\s\\S]*?\\}`,
        "gm"
      ).test(json)
    ) {
      let destPath = `${workDir}/node_modules/${word.replace(
        /"/g,
        ""
      )}/README.md`;
      if (fs.existsSync(destPath)) {
        // new vscode.Position(0, 0) 表示跳转到某个文件的第一行第一列
        return new vscode.Location(
          vscode.Uri.file(destPath),
          new vscode.Position(0, 0)
        );
      }
    }
  }
}

const disposable = vscode.commands.registerCommand(
  "extension.helloWorld",
  () => {
    // The code you place here will be executed every time your command is executed
    vscode.window.showInformationMessage("Hello world");
    // Display a message box to the user
  }
);

export default (context: vscode.ExtensionContext): void => {
  // 注册如何实现跳转到定义，第一个参数表示仅对json文件生效
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(["js"], {
      provideDefinition
    })
  );
};
