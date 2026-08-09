chrome.action.onClicked.addListener((tab) => {
    // Inject the content script into the active tab
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
            console.error("Script execution failed: ", chrome.runtime.lastError);
            return;
        }
        
        const data = results[0].result;
        if (data && !data.error) {
            // Send the extracted data to the local VS Code server
            fetch('http://localhost:10044', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if(response.ok) {
                    console.log("Successfully sent to VS Code!");
                    // Optional: Show a badge on the extension icon
                    chrome.action.setBadgeText({text: "OK", tabId: tab.id});
                    setTimeout(() => chrome.action.setBadgeText({text: "", tabId: tab.id}), 2000);
                }
            })
            .catch(error => {
                console.error("Failed to send data to VS Code. Is the server running?", error);
                chrome.action.setBadgeText({text: "ERR", tabId: tab.id});
                setTimeout(() => chrome.action.setBadgeText({text: "", tabId: tab.id}), 2000);
            });
        }
    });
});
