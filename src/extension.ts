import * as vscode from 'vscode';
import * as fs from 'fs';
import { ollamabackend } from './ollama';

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeTranslator extension is now active!');

    const handleSelection = vscode.commands.registerCommand('codetranslator.handleSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        const panel = vscode.window.createWebviewPanel(
            'TranslationInterface',
            'Code Translator',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'webview')
                ]
            }
        );

        panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, selectedText);

        panel.webview.onDidReceiveMessage(async (message: { command: string; language?: string; userInput?: string; output?: string }) => {
            switch (message.command) {
                case 'dropdownChange': {
                    const selectedLanguage = message.language;
                    vscode.window.showInformationMessage(`Language changed to: ${selectedLanguage}`);

                    // Example translation logic — replace with real AI logic later
                    const newTranslation = selectedText.toUpperCase();

                    panel.webview.postMessage({
                        command: 'updateOutput',
                        text: newTranslation
                    });
                    break;
                }

                case 'processCode': {
                    if (message.userInput) {
                        vscode.window.showInformationMessage(`Requesting Information...`);

                    const onToken = (token: string) => {
                        panel.webview.postMessage({
                            command: 'streamToken',
                            token: token
                        });
                    };
                        vscode.window.showInformationMessage(`hitting prompt...`);
                        const prompt = `Translate the following code to ${message.language}
                        :\n\n${selectedText}\n\nAdditional instructions: ${message.userInput}`;

                        const aiResponse = await ollamabackend(prompt, onToken);
                        console.log('AI Response:', aiResponse);
                        panel.webview.postMessage({
                            command: 'updateAIOutput',
                            text: aiResponse
                        });
                    }

                    break;
                }
            }
        });
    });

    context.subscriptions.push(handleSelection);
}

export function deactivate() {}

/**
 * Loads the HTML and injects the URIs and selected text.
 */
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, selectedText: string): string {
    const htmlPath = vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'index.html');
    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'style.css'));
    const cspSource = webview.cspSource;

    // Inject URIs and selected text
    html = html
        .replace(/\$\{scriptUri\}/g, scriptUri.toString())
        .replace(/\$\{styleUri\}/g, styleUri.toString())
        .replace(/\$\{cspSource\}/g, cspSource)
        .replace(/\$\{selectedText\}/g, escapeHtml(selectedText));

    return html;
}

/**
 * Escapes HTML special characters to prevent injection.
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}