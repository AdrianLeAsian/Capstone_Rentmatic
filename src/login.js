// Remove or comment out the tutorial/popup code
// async function showLoginTutorial() { ... }

// Modify the initialization/page load logic to not show the popup
document.addEventListener('DOMContentLoaded', async () => {
    // If you want to keep auto-login without the popup, use this:
    const savedCredentials = await window.electronAPI.getSavedCredentials();
    if (savedCredentials) {
        // Optionally auto-login without asking
        handleSavedCredentialsLogin();
    }
    
    // Or simply do nothing with saved credentials and let user login manually
}); 