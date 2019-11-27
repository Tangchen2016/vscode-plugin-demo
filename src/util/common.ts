import {
  Uri,
  workspace
} from "vscode";
import { StatInfo } from "../completion/type";
import { existsSync, statSync } from "fs";
import * as path from 'path';

export function isObject(obj: any): obj is StatInfo {
  return Object.prototype.toString.call(obj) === '[object Object]';
}


/**
 * 寻找一个最近似的alias，例如有如下alias列表['@', '@src'], 有一个输入是'@src/teste/test', 这时候应该返回`@src` 
 * 
 * @export
 * @param {string[]} aliasList 
 * @param {string} path 
 * @returns {string}
 */
export function mostLikeAlias(aliasList: string[], path: string): string {
  let index = -1;
  aliasList.forEach((curAlias, i) => {
    if (path === curAlias) {
      index = i;
    }
  });
  return index !== -1 ? aliasList[index] : '';
}


export function normalizePath(absolutePath: string) {
  if (existsSync(absolutePath)) {
    if (statSync(absolutePath).isDirectory()) {
      const indexFile = path.join(absolutePath, 'index.js');
      if (existsSync(indexFile)) {
        absolutePath = indexFile;
      }
    }
  }
  return absolutePath;
}

/**
 * 返回给定的uri属于的workSpaceFolder 索引
 * 
 * @export
 * @param {Uri} uri 
 * @returns {(number | undefined)}
 */
export function getIndexOfWorkspaceFolder(uri: Uri): number | undefined {
  const ws = workspace.getWorkspaceFolder(uri);
  if (ws) {
    return ws.index;
  }
  return undefined;
}