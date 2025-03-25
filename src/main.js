// Modify or add this function for handling popups
function createPopupWindow(message) {
    const popupWindow = new BrowserWindow({
        width: 300,
        height: 150,
        parent: mainWindow, // Parent to main window
        modal: false,      // Key fix: Set modal to false
        frame: false,      // Optional: Remove window frame for cleaner look
        resizable: false,
        transparent: true, // Optional: For better visual integration
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load your popup HTML
    popupWindow.loadFile('src/components/popup.html');

    // Send the message to the popup window
    popupWindow.webContents.on('did-finish-load', () => {
        popupWindow.webContents.send('popup-message', message);
    });

    // Ensure main window gets focus after popup closes
    popupWindow.on('closed', () => {
        mainWindow.focus();
    });

    return popupWindow;
}

// Modify your IPC handlers
ipcMain.handle('show-popup', async (event, message) => {
    const popupWindow = createPopupWindow(message);
    return new Promise((resolve) => {
        ipcMain.once('popup-response', (event, response) => {
            popupWindow.close();
            resolve(response);
        });
    });
});

// Modify or add these imports at the top
const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Replace any system dialog/popup with this non-blocking version
function showNonBlockingDialog(message) {
    return dialog.showMessageBox(mainWindow, {
        message: message,
        buttons: ['OK', 'Cancel'],
        noLink: true,
        type: 'question',
        defaultId: 0,
        cancelId: 1,
        title: 'Confirm',
        modal: false  // Critical: ensure it's not modal
    });
}

// Add this IPC handler
ipcMain.handle('show-dialog', async (event, message) => {
    const result = await showNonBlockingDialog(message);
    return result.response === 0; // Returns true for OK, false for Cancel
});

// Single source of truth for data path
const documentsPath = app.getPath('documents');
const rentmaticPath = path.join(documentsPath, 'Rentmatic');
const dataPath = path.join(rentmaticPath, 'data');

// IPC handler for getData
ipcMain.handle('getData', async (event, dataType) => {
    try {
        // Ensure we're only reading from Documents/Rentmatic/data
        const filePath = path.join(dataPath, `${dataType}.json`);
        console.log('Reading from:', filePath); // Debug log
        
        if (!fs.existsSync(rentmaticPath)) {
            fs.mkdirSync(rentmaticPath, { recursive: true });
        }
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        
        if (fs.existsSync(filePath)) {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
});

// IPC handler for saveData
ipcMain.handle('saveData', async (event, dataType, data) => {
    try {
        // Ensure we're only writing to Documents/Rentmatic/data
        if (!fs.existsSync(rentmaticPath)) {
            fs.mkdirSync(rentmaticPath, { recursive: true });
        }
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        
        const filePath = path.join(dataPath, `${dataType}.json`);
        console.log('Saving to:', filePath); // Debug log
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
});

// Add this to verify data location
ipcMain.handle('getDataPath', () => {
    return dataPath;
});

// Add this IPC handler
ipcMain.handle('clearAllData', async () => {
    try {
        if (fs.existsSync(dataPath)) {
            const files = await fs.promises.readdir(dataPath);
            for (const file of files) {
                await fs.promises.unlink(path.join(dataPath, file));
            }
        }
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}); 