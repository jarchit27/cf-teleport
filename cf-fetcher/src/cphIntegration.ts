import * as vscode from 'vscode';
import * as http from 'http';

export async function triggerCPH(payload: any) {
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
                        res.resume(); // consume body to avoid socket leak
                        vscode.window.showInformationMessage(`🚀 Handed off to CPH! (Port ${port})`);
                        success = true;
                        resolve();
                    } else {
                        res.resume(); // consume body to avoid socket leak
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
