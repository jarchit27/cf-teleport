import * as vscode from 'vscode';
import * as http from 'http';
import { handleIncomingProblems } from './fileManager';

let server: http.Server | undefined;
let requestQueue: Promise<void> = Promise.resolve();

export function startServer() {
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
            req.on('end', () => {
                requestQueue = requestQueue.then(async () => {
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
                }).catch(console.error);
            });
        }
    });

    server.listen(10044, '127.0.0.1', () => {
        console.log('Codeforces Receiver listening on port 10044');
    });
}

export function stopServer() {
    if (server) server.close();
}
