
import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {


	console.log('Congratulations, your extension "codetranslator" is now active!');


	const disposable = vscode.commands.registerCommand('codetranslator.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from CodeTranslator!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
