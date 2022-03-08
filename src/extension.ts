import * as vscode from 'vscode';
import { AwaitPostfixOperatorEditorProvider } from './awaitPostfixOperatorEditorProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(AwaitPostfixOperatorEditorProvider.register(context));
}

export function deactivate() {
	AwaitPostfixOperatorEditorProvider.unregister();
}
