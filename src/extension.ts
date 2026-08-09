import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { getWebviewHtml } from './webview';

let server: http.Server | undefined;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('cf-fetcher.fetchContest', async () => {
        vscode.window.showInformationMessage("Codeforces Companion server is running! Please click the Chrome Extension button when on the 'All Problems' page.");
    });
    context.subscriptions.push(disposable);

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
    startServer(context);
}

function startServer(context: vscode.ExtensionContext) {
    server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    await handleIncomingProblems(data);
                    res.writeHead(200);
                    res.end('OK');
                } catch (e: any) {
                    console.error(e);
                    vscode.window.showErrorMessage("Error parsing problem data: " + e.message);
                    res.writeHead(500);
                    res.end('Error parsing data');
                }
            });
        }
    });

    server.listen(10044, '127.0.0.1', () => {
        console.log('Codeforces Receiver listening on port 10044');
    });
}

async function handleIncomingProblems(data: any) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("Please open a workspace folder first to store the problems.");
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    
    // Payload contains contestId and array of problems
    const contestId = data.contestId || 'Live';
    const problems = data.problems || [data]; // Fallback if single

    const contestDir = path.join(workspacePath, contestId);
    if (!fs.existsSync(contestDir)) {
        fs.mkdirSync(contestDir, { recursive: true });
    }

    let savedCount = 0;
    for (const p of problems) {
        const id = p.id || 'A';
        const name = p.name ? p.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Problem';
        const baseName = `${id}_${name}`;

        // Save HTML preview file
        const htmlPath = path.join(contestDir, `${baseName}.cf`);
        fs.writeFileSync(htmlPath, p.htmlStatement || 'No description provided.', 'utf8');

        // Save hidden JSON for CPH test cases
        const jsonPath = path.join(contestDir, `.${baseName}.json`);
        
        // Format for Competitive Companion / CPH
        const cphPayload = {
            name: p.name,
            group: `Codeforces - ${contestId}`,
            url: p.url,
            memoryLimit: parseInt(p.memoryLimit) || 256,
            timeLimit: parseInt(p.timeLimit) ? parseInt(p.timeLimit) * 1000 : 1000,
            tests: p.tests,
            testType: "single"
        };
        fs.writeFileSync(jsonPath, JSON.stringify(cphPayload, null, 2), 'utf8');
        savedCount++;
    }

    vscode.window.showInformationMessage(`Successfully saved ${savedCount} problems in ${contestId}/! Click a .cf file to preview.`);
}

async function triggerCPH(payload: any) {
    const ports = [10043, 10045, 27121];
    let success = false;
    
    for (const port of ports) {
        try {
            await new Promise<void>((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: port,
                    path: '/',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 2000
                }, (res) => {
                    if (res.statusCode === 200) {
                        vscode.window.showInformationMessage(`🚀 Handed off to CPH! (Port ${port})`);
                        success = true;
                        resolve();
                    } else {
                        reject(new Error(`Status ${res.statusCode}`));
                    }
                });

                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
                
                req.write(JSON.stringify(payload));
                req.end();
            });
            
            if (success) break;
        } catch (e) {
            // Ignore error and try the next port in the array
        }
    }

    if (!success) {
        vscode.window.showErrorMessage("Failed to reach CPH on ports 10043, 10045, or 27121. Is the CPH extension running?");
    }
}

class CfEditorProvider implements vscode.CustomTextEditorProvider {
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

        webviewPanel.webview.html = getWebviewHtml(htmlContent, JSON.stringify(cphPayload));

        webviewPanel.webview.onDidReceiveMessage(e => {
            if (e.type === 'codeNow') {
                vscode.commands.executeCommand('cf-fetcher.codeNow', e.payload);
            }
        });
    }
}

export function deactivate() {
    if (server) server.close();
}
