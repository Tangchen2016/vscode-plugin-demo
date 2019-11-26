import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function showError(info: string) {
    vscode.window.showErrorMessage(info);
}

/**
 * 获取当前所在工程根目录，有3种使用方法：<br>
 * getProjectPath(uri) uri 表示工程内某个文件的路径<br>
 * getProjectPath(document) document 表示当前被打开的文件document对象<br>
 * getProjectPath() 会自动从 activeTextEditor 拿document对象，如果没有拿到则报错
 * @param {vscode.TextDocument} document 
 */
export function getProjectPath(document: vscode.TextDocument | null): string {
    if (!document) {
        document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
    }
    if (!document) {
        showError('当前激活的编辑器不是文件或者没有文件被打开！');
        return '';
    }
    const currentFile = document.uri.fsPath;
    let projectPath = null;

    let workspaceFolders = (vscode.workspace.workspaceFolders || []).map((item: vscode.WorkspaceFolder) => item.uri.path);
    // 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
    // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
    if (workspaceFolders.length == 1 && workspaceFolders[0] === vscode.workspace.rootPath) {
        const rootPath = workspaceFolders[0];
        var files = fs.readdirSync(rootPath);
        workspaceFolders = files.filter((name: string) => !/^\./g.test(name)).map((name: string) => path.resolve(rootPath, name));
        // vscode.workspace.rootPath会不准确，且已过时
        // return vscode.workspace.rootPath + '/' + this._getProjectName(vscode, document);
    }
    workspaceFolders.forEach((folder: string) => {
        if (currentFile.indexOf(folder) === 0) {
            projectPath = folder;
        }
    })
    if (!projectPath) {
        showError('获取工程根路径异常！');
        return '';
    }
    return projectPath;
}

/**
 * 从某个文件里面查找某个字符串，返回第一个匹配处的行与列，未找到返回第一行第一列
 * @param {string} filePath 要查找的文件
 * @param {string | RegExp} reg 正则对象，最好不要带g，也可以是字符串
 * @returns {row: number, col: number} 目标行数和列数
 */
export function findStrInFile (filePath: string, reg: string | RegExp): {row: number, col: number} {
    const content = fs.readFileSync(filePath, 'utf-8');
    reg = typeof reg === 'string' ? new RegExp(reg, 'm') : reg;
    // 没找到直接返回
    if (content.search(reg) < 0) return {row: 0, col: 0};
    const rows = content.split(os.EOL);
    // 分行查找只为了拿到行
    for(let i = 0; i < rows.length; i++) {
        let col = rows[i].search(reg);
        if(col >= 0) {
            return {row: i, col};
        }
    }
    return {row: 0, col: 0};
}

/**
 * 获取某个字符串在文件里第一次出现位置的范围，
 */
export function getStrRangeInFile (filePath: string, str: string): vscode.Range {
    var pos = findStrInFile(filePath, str);
    return new vscode.Range(new vscode.Position(pos.row, pos.col), new vscode.Position(pos.row, pos.col + str.length));
}

/**
 * 在vscode中打开某个文件
 * @param {string} path 文件绝对路径
 * @param {string} text 可选，如果不为空，则选中第一处匹配的对应文字
 */
export function openFileInVscode (path: string, text: string):void {
    let options = undefined;
    if (text) {
        const selection = getStrRangeInFile(path, text);
        console.log('selection:', selection);
        
        options = { selection };
    }
    vscode.window.showTextDocument(vscode.Uri.file(path), options);
}


