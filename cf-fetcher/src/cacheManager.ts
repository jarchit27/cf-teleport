import * as fs from 'fs';
import * as path from 'path';
import { Problem } from './fetcher';
import * as vscode from 'vscode';

// We store data in a .cph-like hidden folder in the workspace
const CACHE_DIR = '.cf-fetcher';

export async function getCachedContest(workspacePath: string, contestId: string): Promise<Problem[] | null> {
    const cachePath = path.join(workspacePath, CACHE_DIR, `contest_${contestId}.json`);
    
    if (fs.existsSync(cachePath)) {
        try {
            const data = fs.readFileSync(cachePath, 'utf8');
            return JSON.parse(data) as Problem[];
        } catch (e) {
            console.error("Error reading cache", e);
            return null;
        }
    }
    return null;
}

export async function saveContestToCache(workspacePath: string, contestId: string, problems: Problem[]): Promise<void> {
    const dirPath = path.join(workspacePath, CACHE_DIR);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const cachePath = path.join(dirPath, `contest_${contestId}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(problems, null, 2), 'utf8');
    
    // Create folders for each problem (like CPH does for easy navigation)
    const contestDir = path.join(workspacePath, `Contest_${contestId}`);
    if (!fs.existsSync(contestDir)) {
        fs.mkdirSync(contestDir, { recursive: true });
    }

    for (const problem of problems) {
        const safeId = problem.id || "P";
        const probDir = path.join(contestDir, safeId);
        if (!fs.existsSync(probDir)) {
            fs.mkdirSync(probDir, { recursive: true });
        }
        
        // Generate a blank main.cpp for convenience
        const cppPath = path.join(probDir, 'main.cpp');
        if (!fs.existsSync(cppPath)) {
            const template = `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code for ${problem.name}\n    return 0;\n}\n`;
            fs.writeFileSync(cppPath, template, 'utf8');
        }
    }
}
