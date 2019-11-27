import {
  DefinitionProvider,
  TextDocument,
  Position,
  CancellationToken,
  ProviderResult,
  Location,
  LocationLink,
  Uri
} from 'vscode';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import { AliasStatTree, StatInfo } from '../completion/type';
import {
  isObject,
  getIndexOfWorkspaceFolder,
  mostLikeAlias,
  normalizePath
} from '../util/common'
import { Nullable } from '../util/types';
import { traverse } from '../util/traverseSourceFile';

export class PathAliasDefinition implements DefinitionProvider {
  private _statMap!: AliasStatTree[];
  private _aliasList: string[][] = [];
  provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Location | Location[] | LocationLink[]> {
    const reg = /\"(.*)\"|\'(.*)\'/;
    const range = document.getWordRangeAtPosition(position, reg);
    const index = getIndexOfWorkspaceFolder(document.uri);
    if (index === undefined) {
      return null;
    }
    if (range) {
      const inputPath = document.getText(range)
      const resPath = inputPath.slice(1, -1);
      const mostLike = mostLikeAlias(this._aliasList[index], resPath.split('/')[0]);
      if (mostLike) {
        let statInfo: StatInfo = this._statMap[index][mostLike];
        let splitPath = resPath.split('/').slice(1).filter(Boolean);
        const lastStatInfo = splitPath
          .slice(0, -1)
          .reduce((pre: Nullable<StatInfo>, cur) => {
            if (isObject(pre)) {
              pre = pre.children[cur];
              return pre;
            }
            return null;
          }, statInfo);
        const currentDocumentExt = path.extname(document.uri.path);

        if (lastStatInfo) {
          let lastPath = lastStatInfo.children[splitPath[splitPath.length - 1]];
          if (lastPath) {
            if (lastPath.type === 'file') {
              return new Location(
                Uri.file(lastPath.absolutePath),
                new Position(0, 0)
              );
            } else {
              const currentFileIndexPath = path.resolve(
                lastPath.absolutePath,
                `index.${currentDocumentExt}`
              );
              const currentFileIndexJsPath = path.resolve(
                lastPath.absolutePath,
                `index.js`
              );
              if (existsSync(currentFileIndexPath)) {
                return new Location(
                  Uri.file(currentFileIndexPath),
                  new Position(0, 0)
                );
              } else if (existsSync(currentFileIndexJsPath)) {
                return new Location(
                  Uri.file(currentFileIndexJsPath),
                  new Position(0, 0)
                );
              }
            }
          } else {
            const lastPathDir = lastStatInfo.absolutePath;
            const lastPathString = splitPath[splitPath.length - 1];
            const lastPathPrefix = path.resolve(lastPathDir, lastPathString);
            const currentDocumentTypePath = lastPathPrefix + currentDocumentExt;
            const JsTypePath = lastPathPrefix + '.js';
            if (existsSync(currentDocumentTypePath)) {
              return new Location(
                Uri.file(currentDocumentTypePath),
                new Position(0, 0)
              );
            } else if (existsSync(JsTypePath)) {
              return new Location(Uri.file(JsTypePath), new Position(0, 0));
            }
            return null;
          }
        }
      }
    } else {
      return this.importDefination(document, position);
    }
    return null;
  }

  private importDefination(document: TextDocument, position: Position) {
    const importReg = /(import\s*){([^{}]*)}\s*from\s*(?:('(?:.*)'|"(?:.*)"))/g;
    const content = document.getText();
    const zeroBasedPosition = document.offsetAt(position);
    const wsIndex = getIndexOfWorkspaceFolder(document.uri);
    if (wsIndex === undefined) {
      return null;
    }
    console.time('reg');
    let execResult: Nullable<RegExpExecArray> = null;
    while ((execResult = importReg.exec(content))) {
      const [, beforeLeftBrace, importIdentifiers] = execResult;
      const index = execResult.index;
      const leftBranchStart = index + beforeLeftBrace.length;
      if (
        zeroBasedPosition > leftBranchStart && 
        zeroBasedPosition <= leftBranchStart + importIdentifiers.length + 1
      ) {
        break;
      }
    }
    console.timeEnd('reg');
    if (execResult) {
      const reg = /\w+/;
      const wordRange = document.getWordRangeAtPosition(position, reg);
      if (!wordRange) {
        return null;
      }
      const word = document.getText(wordRange);
      let [, , , pathAlias] = execResult;
      pathAlias = pathAlias.slice(1, -1);
      const mostLike = mostLikeAlias(
        this._aliasList[wsIndex],
        pathAlias.split('/')[0]
      );
      if (mostLike) {
        const pathList = [
          this._statMap[wsIndex][mostLike]['absolutePath'],
          ...pathAlias.split('/')[0]
        ];
        let absolutePath = path.join(...pathList);
        let extname = path.extname(absolutePath);
        if (!extname) {
          if (existsSync(`${absolutePath}.js`)) {
            extname = 'js';
          } else if (existsSync(`${absolutePath}.ts`)) {
            extname = 'ts';
          } else if (existsSync(normalizePath(absolutePath))) {
            absolutePath += '/index';
            extname = 'js';
          }
        }
        if (extname === 'js' || extname === 'ts') {
          console.time('ast');
          const absolutePathWithExtname = absolutePath + '.' + extname;
          const file = readFileSync(absolutePathWithExtname, {
            encoding: 'utf8'
          });
          const exportIdentifierList = traverse(absolutePathWithExtname, file);
          const retDefination = exportIdentifierList.filter(
            token => token.identifier === word
          )[0];
          console.timeEnd('ast');
          if (retDefination) {
            return new Location(
              Uri.file(absolutePathWithExtname),
              new Position(
                retDefination.position.line,
                retDefination.position.character
              )
            )
          }
        }
      }
    }
  }
}