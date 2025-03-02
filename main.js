const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure notes directory exists
const notesDir = path.join(__dirname, 'notes');
if (!fs.existsSync(notesDir)) {
	fs.mkdirSync(notesDir, { recursive: true });
}

function createWindow () {
	const win = new BrowserWindow({
		width: 1024,  // Increased width for better visibility
		height: 768,  // Increased height for better visibility
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false, // Disable sandbox for now to allow require in preload
			preload: path.join(__dirname, 'preload.js'),
			webSecurity: true
		}
	});

	ipcMain.handle('create-file', (req, data) => {
		try {
			if (!data || !data.title || !data.content) return { success: false, error: 'Invalid data' };

			const filePath = path.join(notesDir, `${data.title}.txt`);
			fs.writeFileSync(filePath, data.content);

			return { success: true, filePath };
		} catch (error) {
			console.error('Error creating file:', error);
			return { success: false, error: error.message };
		}
	});

	win.loadFile(path.join(__dirname, 'src', 'dashboard.html'));
	
	// Open DevTools automatically
	win.webContents.openDevTools();
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});