/**
 * webview.ts
 * Generates the HTML for .cf problem preview webviews.
 * Design perfectly mirrors the original Codeforces website (light mode)
 * by utilizing the official Codeforces CSS and DOM wrappers.
 */

export function getWebviewHtml(statementHtml: string, payloadStr: string): string {
    return /* html */`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <!-- Official Codeforces Stylesheets -->
            <link rel="stylesheet" type="text/css" href="https://codeforces.org/s/0/css/font-awesome.min.css">
            <link rel="stylesheet" type="text/css" href="https://codeforces.org/s/0/css/problem-statement.css">
            
            <!-- Standard fonts -->
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">

            <!-- KaTeX -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>

            <style>
                body {
                    /* Base Codeforces light theme body styles */
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    background-color: #fff;
                    color: #222;
                    margin: 0;
                    padding: 20px 40px 100px 40px; /* Extra bottom padding for floating button */
                    font-size: 14px;
                }

                .cf-page-wrapper {
                    max-width: 960px;
                    margin: 0 auto;
                    background-color: #fff;
                }

                /* KaTeX math colors (black on light bg to match CF math) */
                .katex, .katex * { color: #000 !important; font-size: 1.05em; }

                /* Custom Copy button styling adapted for CF light theme */
                .cf-copy-btn {
                    float: right;
                    cursor: pointer;
                    color: #888;
                    font-size: 12px;
                    text-transform: none;
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    background: #f8f8f8;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    padding: 2px 8px;
                    margin-top: -2px;
                    line-height: 1.2;
                }
                .cf-copy-btn:hover {
                    color: #333;
                    border-color: #888;
                    background: #eee;
                }
                .cf-copy-btn.copied {
                    color: #006600;
                    border-color: #006600;
                    background: #e6f9e6;
                }

                /* Floating "Code Now" button */
                #cf-code-now {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    border: 1px solid #1a73e8;
                    border-radius: 4px;
                    padding: 10px 20px;
                    font-family: 'Open Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                    background: #1a73e8;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #cf-code-now:hover {
                    background: #1557b0;
                    box-shadow: 0 6px 10px rgba(0,0,0,0.3);
                }
            </style>
        </head>
        <body>
            <div class="cf-page-wrapper">
                <!-- 
                   Crucial wrappers: problemindexholder and ttypography 
                   These are required for problem-statement.css to apply its rules! 
                -->
                <div class="problemindexholder">
                    <div class="ttypography">
                        ${statementHtml}
                    </div>
                </div>
            </div>

            <button id="cf-code-now" onclick="codeNow()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                Code Now &rarr; CPH
            </button>

            <script>
                const vscode = acquireVsCodeApi();
                const payload = ${payloadStr};

                function codeNow() {
                    vscode.postMessage({ type: 'codeNow', payload: payload });
                }

                document.addEventListener("DOMContentLoaded", function () {
                    // 1. KaTeX math rendering
                    if (window.renderMathInElement) {
                        renderMathInElement(document.body, {
                            delimiters: [
                                { left: "$$$$$$", right: "$$$$$$", display: true  },
                                { left: "$$$",    right: "$$$",    display: false },
                            ],
                            throwOnError: false,
                        });
                    }

                    // 2. Add custom Copy button to the sample tests
                    document.querySelectorAll('.sample-tests .input, .sample-tests .output').forEach(function(block) {
                        var titleDiv = block.querySelector('.title');
                        if (!titleDiv) return;

                        var btn = document.createElement('button');
                        btn.className = 'cf-copy-btn';
                        btn.textContent = 'Copy';
                        
                        var pre = block.querySelector('pre');
                        
                        btn.onclick = function() {
                            if (!pre) return;
                            
                            // CF often uses divs inside pre for lines. 
                            // Get raw text replacing <br> with newline.
                            var rawHtml = pre.innerHTML.replace(/<br\\s*\\/?>/gi, "\\n").replace(/<[^>]+>/g, "");
                            var text = rawHtml.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
                            
                            navigator.clipboard.writeText(text.trim()).then(function() {
                                btn.textContent = 'Copied';
                                btn.classList.add('copied');
                                setTimeout(function() {
                                    btn.textContent = 'Copy';
                                    btn.classList.remove('copied');
                                }, 1500);
                            });
                        };
                        
                        titleDiv.appendChild(btn);
                    });
                });
            </script>
        </body>
        </html>
    `;
}
