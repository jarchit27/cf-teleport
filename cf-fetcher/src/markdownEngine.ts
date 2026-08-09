import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt = require('markdown-it');
import hljs from 'highlight.js';

export class MarkdownEngine {
    private engine: any;

    constructor() {
        this.engine = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            highlight: (code, lang) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (__) {}
                }
                return ''; // use external default escaping
            }
        });
    }

    public render(md: string): string {
        return this.engine.render(md);
    }

    public getStyles(webview: vscode.Webview): string {
        return this.getBuiltinStyles(webview);
    }

    private getBuiltinStyles(webview: vscode.Webview): string {
        const mdExt = vscode.extensions.getExtension("vscode.markdown-language-features");
        if (!mdExt) {
            console.error("[Error] markdown-language-features extension not found.");
            return "";
        }

        const extRoot = mdExt.extensionPath;
        let styles: vscode.Uri[] = [];

        try {
            const packageJsonPath = path.join(extRoot, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const stylePaths = packageJson?.contributes?.["markdown.previewStyles"] ?? [];
                
                styles = stylePaths.map((relPath: string) => {
                    const styleUri = vscode.Uri.file(path.join(extRoot, relPath));
                    return webview.asWebviewUri(styleUri);
                });
            }
        } catch (error) {
            console.error(`[Error] Fail to load built-in markdown style file: ${error}`);
        }

        return styles
            .map((style) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`)
            .join("\n");
    }
}

export const markdownEngine = new MarkdownEngine();
