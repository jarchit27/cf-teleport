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
            const ports = [10044, 10042, 10041, 4244, 6174, 8989];

            const sendToNextPort = (index) => {
                if (index >= ports.length) {
                    console.error("Failed to send data to VS Code on any port.");
                    chrome.action.setBadgeText({text: "ERR", tabId: tab.id});
                    setTimeout(() => chrome.action.setBadgeText({text: "", tabId: tab.id}), 2000);
                    return;
                }

                const port = ports[index];
                fetch(`http://localhost:${port}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(response => {
                    if (response.ok) {
                        console.log(`Successfully sent to VS Code on port ${port}!`);
                        chrome.action.setBadgeText({text: "OK", tabId: tab.id});
                        setTimeout(() => chrome.action.setBadgeText({text: "", tabId: tab.id}), 2000);
                    } else {
                        sendToNextPort(index + 1);
                    }
                })
                .catch(() => {
                    sendToNextPort(index + 1);
                });
            };

            sendToNextPort(0);
        }
    });
});
