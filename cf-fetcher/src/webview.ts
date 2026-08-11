import * as vscode from 'vscode';
import { parseCodeforcesDescription } from './htmlParser';
import { markdownEngine } from './markdownEngine';

import * as crypto from 'crypto';

export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, statementHtml: string, payloadStr: string): string {
    const payload = JSON.parse(payloadStr || "{}");
    const description = parseCodeforcesDescription(statementHtml, payload);
    
    // Build the Markdown-like HTML layout (similar to Wiroxa)
    const head = `<h1 class="problem-title">\n<a href="${description.url}" target="_blank">${description.title}</a>\n</h1>`;
    const info = `<p><strong>Rating:</strong> ${description.rating}</p>`;
    const time = `<p><strong>Time limit per test:</strong> ${description.timeLimit}</p>`;
    const memory = `<p><strong>Memory limit per test:</strong> ${description.memoryLimit}</p>`;
    
    let tags = "";
    if (description.tags && description.tags.length > 0) {
        tags = [
            `<details>`,
            `<summary><strong>Tags</strong></summary>`,
            `<div style="display: flex; flex-wrap: wrap; gap: 0.5em; margin-top: 0.5em;">`,
            description.tags.map((t: string) => `<code>${t}</code>`).join("\n"),
            `</div>`,
            `</details>`
        ].join("\n");
    }

    const problemBody = description.body;

    const fullHtmlBody = [
        head,
        info,
        time,
        memory,
        tags,
        "<hr/>",
        problemBody
    ].join("\n");

    const renderedBody = markdownEngine.render(fullHtmlBody);

    const nonce = crypto.randomBytes(16).toString('base64');

    const styles = [
        markdownEngine.getStyles(webview),
        `<link rel="stylesheet" type="text/css" href="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "public", "styles", "style.css"))}">`,
        `<link rel="stylesheet" type="text/css" href="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "public", "styles", "katex.min.css"))}">`
    ].join('\n');

    const scripts = [
        `<script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "public", "scripts", "katex.min.js"))}"></script>`,
        `<script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "public", "scripts", "auto-render.min.js"))}"></script>`,
        `<script nonce="${nonce}" src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "public", "scripts", "clipboard.min.js"))}"></script>`
    ].join('\n');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' https:; font-src ${webview.cspSource} https: data:;">
        
        ${styles}

        <style>
            #cf-code-now {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                border: 2px solid #00FFCC;
                border-radius: 12px;
                padding: 14px 28px;
                font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                font-size: 16px;
                font-weight: 700;
                color: #000000;
                background-color: #00FFCC;
                box-shadow: 0 8px 24px rgba(0, 255, 204, 0.3);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                z-index: 1000;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #cf-code-now:hover {
                background-color: #000000;
                color: #00FFCC;
                transform: translateY(-4px);
                box-shadow: 0 12px 28px rgba(0, 255, 204, 0.5);
            }
        </style>
        ${scripts}
        </style>
        ${scripts}
    </head>
    <body class="vscode-body">
        ${renderedBody}

        <button id="cf-code-now">
            Code Now &rarr; CPH
        </button>

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const payload = ${payloadStr || "{}"};

            function codeNow() {
                vscode.postMessage({ type: 'codeNow', payload: payload });
            }
            
            document.getElementById('cf-code-now').addEventListener('click', codeNow);

            document.addEventListener("DOMContentLoaded", function () {
                document.querySelectorAll(".input, .output").forEach((block, index) => {
                    const titleDiv = block.querySelector(".title");
                    const codeBlock = block.querySelector("pre code");

                    if (titleDiv && codeBlock) {
                        const copyButton = document.createElement("button");
                        copyButton.textContent = "Copy";
                        copyButton.classList.add("input-output-copier");
                        
                        const uniqueId = "copy-target-" + index;
                        codeBlock.setAttribute("id", uniqueId);
                        copyButton.setAttribute("data-clipboard-target", "#" + uniqueId);

                        titleDiv.appendChild(copyButton);
                    }
                });

                if (window.ClipboardJS) {
                    const clipboard = new ClipboardJS('.input-output-copier');
                    clipboard.on('success', function (e) {
                        e.clearSelection();
                        const oldText = e.trigger.textContent;
                        e.trigger.textContent = "Copied!";
                        setTimeout(() => e.trigger.textContent = oldText, 2000);
                    });
                }

                if (window.renderMathInElement) {
                    renderMathInElement(document.body, {
                        delimiters: [
                            { left: "$$$$$$", right: "$$$$$$", display: true  },
                            { left: "$$$",    right: "$$$",    display: false },
                            { left: "\\\\[",  right: "\\\\]",  display: true  },
                            { left: "\\\\(",  right: "\\\\)",  display: false }
                        ],
                        throwOnError: false,
                    });
                }
            });
        </script>
    </body>
    </html>`;
}
