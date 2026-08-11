import * as vscode from 'vscode';
import { triggerCPH } from './cphIntegration';
import { CfEditorProvider } from './editorProvider';
import { startServer, stopServer } from './server';

export function activate(context: vscode.ExtensionContext) {
    // Register a command to trigger CPH
    let codeNowCmd = vscode.commands.registerCommand('cf-fetcher.codeNow', async (payload: any) => {
        await triggerCPH(payload);
    });
    context.subscriptions.push(codeNowCmd);

    // Register Webview provider for .cf files
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider('cf-fetcher.cfPreview', new CfEditorProvider(context), {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    // Start local server
    startServer();
}

export function deactivate() {
    stopServer();
}
