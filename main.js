const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable GPU acceleration
app.disableHardwareAcceleration();

// Handle cache errors
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
			webSecurity: true,
			allowRunningInsecureContent: false
		}
	});

	// Error handling for window creation
	win.webContents.on('crashed', () => {
		console.log('Window crashed, reloading...');
		win.reload();
	});

	win.on('unresponsive', () => {
		console.log('Window became unresponsive, reloading...');
		win.reload();
	});

	// Load the initial page
	win.loadFile('src/login.html');
}

// Handle app ready
app.whenReady().then(() => {
	createWindow();

	// Handle macOS activation
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Handle window closure
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	console.error('An uncaught error occurred:', error);
});

// IPC handlers
ipcMain.handle('create-file', (req, data) => {
	if (!data || !data.title || !data.content) return false;

	const filePath = path.join(__dirname, 'notes', `${data.title}.txt`);
	fs.writeFileSync(filePath, data.content);

	return { success: true, filePath };
});

