const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ... your other exposed functions ...
    showPopup: (message) => ipcRenderer.invoke('show-popup', message),
    showDialog: (message) => ipcRenderer.invoke('show-dialog', message)
});

contextBridge.exposeInMainWorld('dataAPI', {
    getData: (dataType) => ipcRenderer.invoke('getData', dataType),
    saveData: (dataType, data) => ipcRenderer.invoke('saveData', dataType, data),
    getDataPath: () => ipcRenderer.invoke('getDataPath'),
    getUnit: (unitId) => ipcRenderer.invoke('getUnit', unitId),
    updateUnit: (unitId, data) => ipcRenderer.invoke('updateUnit', unitId, data),
    clearAllData: () => ipcRenderer.invoke('clearAllData')
});

// Add this function to handle the tutorial dialog
function showLoginTutorial() {
    // Only show if we're on the login page
    if (window.location.pathname.includes('login.html')) {
        const tutorialDialog = document.createElement('div');
        tutorialDialog.id = 'tutorialDialog';
        tutorialDialog.className = 'tutorial-dialog';
        tutorialDialog.innerHTML = `
            <div class="tutorial-content">
                <p>Login with saved credentials?</p>
            </div>
            <div class="tutorial-buttons">
                <button class="tutorial-button tutorial-cancel" onclick="closeTutorial()">Cancel</button>
                <button class="tutorial-button tutorial-ok" onclick="handleTutorialOk()">OK</button>
            </div>
        `;
        document.body.appendChild(tutorialDialog);
    }
}

// Add this function to clean up the tutorial dialog
function cleanupTutorial() {
    const tutorialDialog = document.getElementById('tutorialDialog');
    if (tutorialDialog) {
        tutorialDialog.remove();
    }
}

// Modify your navigation function to clean up the tutorial
function navigateToPage(page) {
    cleanupTutorial();
    // ... rest of your navigation logic
} 