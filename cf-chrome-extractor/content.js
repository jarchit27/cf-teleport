function extractProblemData() {
    try {
        const statements = document.querySelectorAll('.problem-statement');
        if (!statements || statements.length === 0) {
            return { error: "No problems found on this page. Please navigate to a specific problem (e.g. /problem/A) or the 'All Problems' page (/problems)." };
        }

        const problems = [];
        
        let contestId = "Live";
        const match = window.location.href.match(/contest\/(\d+)/);
        if (match && match[1]) {
            contestId = match[1];
        }

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            const titleElement = statement.querySelector('.title');
            let title = titleElement ? titleElement.innerText.trim() : "Problem";
            let id = title.split('.')[0] || String.fromCharCode(65 + i);

            // Scrape the HTML statement
            let htmlStatement = statement.innerHTML || "";

            // Extract test cases for this specific problem
            const tests = [];
            const inputs = statement.querySelectorAll('.input pre');
            const outputs = statement.querySelectorAll('.output pre');
            
            for (let j = 0; j < inputs.length; j++) {
                // Codeforces uses <br> or divs for lines in pre, we need to extract raw text
                let inText = inputs[j].innerText.trim() + '\n';
                let outText = outputs[j] ? outputs[j].innerText.trim() + '\n' : '';
                tests.push({ input: inText, output: outText });
            }

            // Time / Memory limits
            const timeLimitEl = statement.querySelector('.time-limit');
            const memoryLimitEl = statement.querySelector('.memory-limit');
            let timeLimit = timeLimitEl ? timeLimitEl.lastChild.textContent.trim() : "1 second";
            let memoryLimit = memoryLimitEl ? memoryLimitEl.lastChild.textContent.trim() : "256 megabytes";

            problems.push({
                id: id,
                name: title,
                url: `https://codeforces.com/contest/${contestId}/problem/${id}`,
                htmlStatement: htmlStatement,
                tests: tests,
                timeLimit: timeLimit,
                memoryLimit: memoryLimit
            });
        }

        return {
            contestId: contestId,
            problems: problems
        };
    } catch (e) {
        console.error("Error extracting data:", e);
        return { error: e.toString() };
    }
}

// Execute and return to the background script
extractProblemData();
