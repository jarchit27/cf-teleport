/**
 * simpleWebview.ts
 * Provides a clean, minimal dark‑mode HTML for .cf problem preview.
 */

export function getSimpleWebviewHtml(statementHtml: string, payloadStr: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <!-- Fonts -->
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />

            <!-- KaTeX for math -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>

            <style>
                :root {
                    --bg:#121212;
                    --text:#e0e0e0;
                    --accent:#00FFCC;
                    --code:#FF00FF;
                }
                *, *::before, *::after {box-sizing:border-box;margin:0;padding:0;}
                html,body {background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
                body {max-width:860px;margin:0 auto;padding:2rem 2rem 8rem;line-height:1.7;font-size:15px;}
                h1.title {font-size:2rem;font-weight:800;margin-bottom:0.5rem;color:var(--accent);}
                .meta {font-size:0.9rem;color:#b0b0b0;margin-bottom:1.5rem;}
                .section {margin-top:1.8rem;}
                .section h2 {font-size:1.3rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:0.3rem;margin-bottom:0.6rem;}
                a {color:var(--accent);}
                pre {background:#1e1e1e;color:var(--code);padding:0.8rem;overflow-x:auto;font-family:'JetBrains Mono',Consolas,monospace;font-size:13px;border-radius:4px;}
                .sample-tests {margin-top:1.5rem;border:1px solid rgba(0,255,204,0.3);border-radius:6px;background:#0a0a0a;}
                .sample-tests .title {background:#111;color:var(--accent);padding:0.6rem 1rem;font-weight:700;display:flex;justify-content:space-between;align-items:center;}
                .copy-btn {font-family:'Plus Jakarta Sans',sans-serif;font-size:0.75rem;font-weight:600;border:1px solid var(--accent);background:var(--accent);color:#000;padding:4px 10px;border-radius:4px;cursor:pointer;transition:0.2s;}
                .copy-btn:hover {background:#000;color:var(--accent);}
                #code-now {
                    position:fixed;bottom:2rem;right:2rem;background:var(--accent);color:#000;border:none;border-radius:8px;padding:12px 24px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,255,204,0.3);transition:0.25s;display:flex;align-items:center;gap:8px;z-index:1000;
                }
                #code-now:hover {background:#000;color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,255,204,0.5);}
            </style>
        </head>
        <body>
            ${statementHtml}
            <button id="code-now" onclick="codeNow()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                Code Now
            </button>
            <script>
                const vscode = acquireVsCodeApi();
                const payload = ${payloadStr};
                function codeNow(){ vscode.postMessage({type:'codeNow', payload}); }
                // Render KaTeX
                if (window.renderMathInElement) {
                    renderMathInElement(document.body,{delimiters:[{left:"$$$$$$",right:"$$$$$$",display:true},{left:"$$$",right:"$$$",display:false}],throwOnError:false});
                }
                // Copy buttons for each sample block
                document.querySelectorAll('.input, .output').forEach(block=>{
                    const title = block.querySelector('.title');
                    const pre = block.querySelector('pre');
                    if (!title||!pre) return;
                    const btn=document.createElement('button');
                    btn.className='copy-btn';
                    btn.textContent='Copy';
                    btn.onclick=()=>{navigator.clipboard.writeText(pre.innerText.trim()).then(()=>{btn.textContent='✓ Copied';setTimeout(()=>{btn.textContent='Copy';},1500);});};
                    title.appendChild(btn);
                });
            </script>
        </body>
        </html>
    `;
}
