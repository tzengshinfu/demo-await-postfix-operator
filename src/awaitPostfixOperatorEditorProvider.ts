import * as vscode from 'vscode';
import { debounce } from 'throttle-debounce';
import { Worker } from "worker_threads";
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import * as Comlink from 'comlink';
import type { AwaitPostfixOperatorConverter } from './awaitPostfixOperatorConverter';

export class AwaitPostfixOperatorEditorProvider {
    public static awaitPostfixOperatorConverter: Comlink.Remote<AwaitPostfixOperatorConverter>;

    /**
     * 註冊後置await運算子(@)的轉換器
     * @param _
     * @returns
     */
    public static register(_: vscode.ExtensionContext): vscode.Disposable {
        const disposable = vscode.commands.registerCommand('awaitPostfixOperatorConverter.convert', async () => {
            if (!vscode.window.activeTextEditor) {
                return;
            }

            const activeTextEditor = vscode.window.activeTextEditor;

            if (!activeTextEditor.document) {
                return;
            }

            const originalDocument = activeTextEditor.document;
            const convertDocumentUri = vscode.Uri.parse("untitled:" + this.getConvertFileName(originalDocument));
            let convertDocument: vscode.TextDocument;
            this.awaitPostfixOperatorConverter = Comlink.wrap<AwaitPostfixOperatorConverter>(nodeEndpoint(new Worker(`${__dirname}/awaitPostfixOperatorConverter.js`)));
            const postfixAwaitCode = await this.awaitPostfixOperatorConverter.convert(originalDocument.getText());

            vscode.workspace.openTextDocument(convertDocumentUri).then((document) => {
                vscode.window.showTextDocument(document, vscode.ViewColumn.Beside, true).then(editor => {
                    editor.edit(edit => {
                        convertDocument = document;

                        edit.insert(new vscode.Position(0, 0), postfixAwaitCode);
                    });
                });
            }, (error: any) => {
                vscode.window.showInformationMessage('Internal Error has Occurred.');
                console.error(error);
                debugger;
            });

            vscode.workspace.onDidChangeTextDocument(event => {
                //加入防抖機制，避免使用者輸入頻率過快造成呼叫轉換函數間隔過短
                debounce(500, async (event: vscode.TextDocumentChangeEvent) => {
                    const edit = new vscode.WorkspaceEdit();

                    if (event.document.uri.toString() === originalDocument.uri.toString()) {
                        //只接受使用者輸入為來源，避免重複觸發onDidChangeTextDocument事件
                        if (originalDocument.fileName !== vscode.window.activeTextEditor!.document.fileName) {
                            return;
                        }

                        const postfixAwaitCode = await this.awaitPostfixOperatorConverter.convert(originalDocument.getText());

                        edit.replace(
                            convertDocument!.uri,
                            new vscode.Range(0, 0, convertDocument.lineCount, 0),
                            postfixAwaitCode);
                        vscode.workspace.applyEdit(edit);
                        return;
                    }

                    if (event.document.uri.toString() === convertDocument.uri.toString()) {
                        //只接受使用者輸入為來源，避免重複觸發onDidChangeTextDocument事件
                        if (convertDocument.fileName !== vscode.window.activeTextEditor!.document.fileName) {
                            return;
                        }

                        const originalAwaitCode = await this.awaitPostfixOperatorConverter.reverse(convertDocument.getText());

                        edit.replace(
                            originalDocument.uri,
                            new vscode.Range(0, 0, originalDocument.lineCount, 0),
                            originalAwaitCode);
                        vscode.workspace.applyEdit(edit);
                        return;
                    }
                })(event);
            });
        });

        return disposable;
    }

    /**
     * 取得轉換後的檔案名稱
     * @param originalDocument 原始檔案
     * @returns 轉換後的檔案名稱
     */
    public static getConvertFileName(originalDocument: vscode.TextDocument): string {
        const fileNameGroup = originalDocument.fileName.split('.');
        let convertFileName = fileNameGroup.length === 1 ? fileNameGroup[0] : fileNameGroup.slice(0, -1).join('.');
        convertFileName = (convertFileName ? convertFileName + '.' + (new Date().getMilliseconds()).toString().padStart(3, '0') : '') + '.js1';
        return convertFileName;
    }

    /**
     * 取消註冊後置await運算子(@)的轉換器
     */
    public static unregister() {
        this.awaitPostfixOperatorConverter.exit();
    }
}
