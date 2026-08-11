import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function handleIncomingProblems(data: any) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("Please open a workspace folder first to store the problems.");
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    
    // Sanitize contestId to prevent path traversal
    let rawContestId = data.contestId || 'Live';
    let contestId = String(rawContestId).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!contestId) contestId = 'Live';

    const contestDir = path.join(workspacePath, contestId);
    
    // Double check path traversal
    if (!contestDir.startsWith(workspacePath)) {
        throw new Error("Invalid contest path");
    }

    if (!fs.existsSync(contestDir)) {
        fs.mkdirSync(contestDir, { recursive: true });
    }

    const problems = data.problems || [data]; // Fallback if single
    let savedCount = 0;

    for (const p of problems) {
        let rawName = p.name ? String(p.name) : 'Problem';
        let rawId = p.id;
        
        // If there's no id provided, try to parse it from the name (e.g. "A. Problem Name")
        if (!rawId) {
            const match = rawName.match(/^([A-Z0-9]+)[.\-_\s]+/i);
            if (match) {
                rawId = match[1];
                rawName = rawName.substring(match[0].length);
            } else {
                rawId = 'A'; // fallback
            }
        } else {
            // If id was provided, check if the name starts with it
            const idStr = String(rawId);
            if (rawName.toUpperCase().startsWith(idStr.toUpperCase())) {
                let chopped = rawName.substring(idStr.length);
                // Chop off any trailing dots, dashes, underscores, or spaces after the ID
                rawName = chopped.replace(/^[.\-_\s]+/, '');
            }
        }

        let id = String(rawId).replace(/[^a-zA-Z0-9_-]/g, '');
        if (!id) id = 'A';
        
        const name = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
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
            timeLimit: parseFloat(p.timeLimit) ? Math.floor(parseFloat(p.timeLimit) * 1000) : 1000,
            tests: p.tests,
            testType: "single"
        };
        fs.writeFileSync(jsonPath, JSON.stringify(cphPayload, null, 2), 'utf8');
        savedCount++;
    }

    vscode.window.showInformationMessage(`Successfully saved ${savedCount} problems in ${contestId}/! Click a .cf file to preview.`);
}
