import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWebviewHtml } from './webview';

export class CfEditorProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = { enableScripts: true };

        const htmlContent = document.getText();
        
        // Read hidden JSON for payload
        const dir = path.dirname(document.uri.fsPath);
        const baseName = path.basename(document.uri.fsPath, '.cf');
        const jsonPath = path.join(dir, `.${baseName}.json`);
        
        let cphPayload = {};
        if (fs.existsSync(jsonPath)) {
            cphPayload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }

        webviewPanel.webview.html = getWebviewHtml(webviewPanel.webview, this.context.extensionUri, htmlContent, JSON.stringify(cphPayload));

        webviewPanel.webview.onDidReceiveMessage(e => {
            if (e.type === 'codeNow') {
                vscode.commands.executeCommand('cf-teleport.codeNow', e.payload);
            }
        });
    }
}
