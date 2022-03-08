import * as Comlink from 'comlink';
import { parentPort } from 'worker_threads';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import { awaitExpression, Node, Expression } from '@babel/types';

/**
 * await運算子轉換為後置await運算子(@)的轉換器
 */
export class AwaitPostfixOperatorConverter {
    /**
     * 取得轉換為後置await運算子(@)的程式碼
     * @param originalCode 原始程式碼
     * @returns 轉換後的程式碼
     */
    public convert(originalCode: string): string {
        try {
            const ast = parser.parse(originalCode, {
                sourceType: 'unambiguous',
                createParenthesizedExpressions: true
            });

            if (ast.errors.length > 0) {
                return '/* parse error */';
            }

            traverse(ast, {
                enter(path) {
                    if (path.node.type === 'ParenthesizedExpression') {
                        if (path.node.expression.type === 'AwaitExpression') {
                            path.replaceWith(path.node.expression);
                        }
                    }
                    else if (path.node.type === 'AwaitExpression') {
                        addPostfixAwaitComment(path);

                        path.replaceWith(path.node.argument);
                    }
                    else if (path.node.type === 'Identifier' || path.node.type === 'MemberExpression' || path.node.type === 'CallExpression') {
                        if (!path.parentPath) {
                            return;
                        }

                        if (path.parentPath.node.type === 'ForOfStatement') {
                            if (path.parentPath.node.await === false) {
                                return;
                            }

                            path.parentPath.node.await = false;

                            addPostfixAwaitComment(path);
                        }
                    }
                }
            });

            let processedCode = generate(ast, {
                retainLines: true,
                retainFunctionParens: true,
                compact: false
            }).code;

            //搜尋/*@*/註解並替換成@
            processedCode = processedCode.replace(/\s*\/\*@\*\/\.\n/g, '@\n\.').replace(/\s*\/\*@\*\//g, '@'); //先將'/*@*/.\n'改成'@\n.'，再將'/*@*/'改成'@'

            return processedCode;
        }
        catch (_) {
            return '/* parse error */';
        }
    }

    /**
     * 取得還原為一般await運算子的程式碼
     * @param convertedCode 轉換後的程式碼
     * @returns 還原後的程式碼
     */
    public reverse(convertedCode: string): string {
        try {
            //搜尋@並替換成/*@*/註解
            const preProcessedCode = convertedCode.replace(/([a-zA-Z0-9_$)])@/g, '$1/*@*/');

            const ast = parser.parse(preProcessedCode, {
                sourceType: 'unambiguous',
                createParenthesizedExpressions: true
            });

            if (ast.errors.length > 0) {
                return '/* parse error */';
            }

            if (!ast.comments) {
                return '/* parse error */';
            }

            traverse(ast, {
                enter(path) {
                    if (!path.node.trailingComments) {
                        return;
                    }

                    const postfixAwaitComment = path.node.trailingComments.find((comment) => { return comment.value === '@'; });

                    if (!postfixAwaitComment) {
                        return;
                    }

                    //移除/*@*/註解
                    removePostfixAwaitComment(path);

                    if (path.node.type === 'Identifier' || path.node.type === 'MemberExpression' || path.node.type === 'CallExpression' || path.node.type === 'NewExpression') {
                        if (!path.parentPath) {
                            return;
                        }

                        if (path.parentPath.node.type === 'ForOfStatement') {
                            path.parentPath.node.await = true;
                        }
                        else {
                            path.replaceWith(awaitExpression(path.node));
                        }
                    }
                    else if (path.node.type === 'VariableDeclarator') {
                        path.scope.traverse(path.node, {
                            enter(path) {
                                let matchTypeCount = 0;
                                matchTypeCount += path.node.type === 'Identifier' && path.key !== 'id' ? 1 : 0;
                                matchTypeCount += path.node.type === 'MemberExpression' ? 1 : 0;
                                matchTypeCount += path.node.type === 'CallExpression' ? 1 : 0;

                                if (matchTypeCount === 0) {
                                    return;
                                }

                                path.replaceWith(awaitExpression(path.node as Expression));
                                path.skip(); //避免[Maximum call stack size exceeded]
                            }
                        }, this);
                    }
                }
            });

            let processedCode = generate(ast, {
                retainLines: true,
                retainFunctionParens: true,
                compact: false
            }).code;

            //搜尋).\n並替換成).
            processedCode = processedCode.replace(/\s*\)\.\n/g, '\)\.');

            return processedCode;
        }
        catch (_) {
            return '/* parse error */';
        }
    }

    /**
     * 離開轉換器Web Worker
     */
    public exit(): void {
        return process.exit();
    }
}

/**
 * 新增後置await運算子(@)的註解
 * @param path 節點路徑
 */
function addPostfixAwaitComment(path: NodePath<Node>) {
    const trailingComments = path.node.trailingComments ?? [];
    path.node.trailingComments = null;
    path.addComment('trailing', '@');
    trailingComments.forEach((comment) => { path.addComment('trailing', comment.value); });
}

/**
 * 移除後置await運算子(@)的註解
 * @param path 節點路徑
 */
function removePostfixAwaitComment(path: NodePath<Node>) {
    const trailingComments = path.node.trailingComments ? path.node.trailingComments.filter((comment) => { return comment.value !== '@'; }) : [];
    path.node.trailingComments = null;
    trailingComments.forEach((comment) => { path.addComment('trailing', comment.value); });
}

Comlink.expose(new AwaitPostfixOperatorConverter(), nodeEndpoint(parentPort!));
