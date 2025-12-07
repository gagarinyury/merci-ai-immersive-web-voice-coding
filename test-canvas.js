window.__CANVAS_CHAT__.addUserMessage("Create a red cube");
setTimeout(() => window.__CANVAS_CHAT__.showToolProgress("Write", "starting"), 1000);
setTimeout(() => window.__CANVAS_CHAT__.showThinkingMessage("Creating a red cube"), 1500);
setTimeout(() => window.__CANVAS_CHAT__.showToolProgress("Write", "completed"), 2500);
setTimeout(() => window.__CANVAS_CHAT__.addAssistantMessage("Created a red cube"), 4000);
setTimeout(() => window.__CANVAS_CHAT__.addUserMessage("Make it blue"), 6000);
setTimeout(() => window.__CANVAS_CHAT__.showToolProgress("Edit", "starting"), 6500);
setTimeout(() => window.__CANVAS_CHAT__.showToolProgress("Edit", "completed"), 7500);
setTimeout(() => window.__CANVAS_CHAT__.addAssistantMessage("Changed to blue"), 8000);
