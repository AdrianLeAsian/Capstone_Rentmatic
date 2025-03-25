const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Change data directory to Documents/Rentmatic
const documentsPath = app.getPath('documents');
const rentmaticPath = path.join(documentsPath, 'Rentmatic');
const dataPath = path.join(rentmaticPath, 'data');

// Create directory structure
const directories = {
	root: rentmaticPath,
	data: dataPath,
	tenants: path.join(dataPath, 'tenants'),
	payments: path.join(dataPath, 'payments'),
	maintenance: path.join(dataPath, 'maintenance'),
	settings: path.join(dataPath, 'settings'),
	units: path.join(dataPath, 'units'),
	messages: path.join(dataPath, 'messages'),
	users: path.join(dataPath, 'users'),
	credentials: path.join(dataPath, 'credentials')
};

// Create directories if they don't exist
Object.values(directories).forEach(dir => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
});

// File paths for different data types
const dataFiles = {
	tenants: path.join(directories.tenants, 'tenants.json'),
	payments: path.join(directories.payments, 'payments.json'),
	maintenance: path.join(directories.maintenance, 'maintenance.json'),
	settings: path.join(directories.settings, 'settings.json'),
	units: path.join(directories.units, 'units.json'),
	messages: path.join(directories.messages, 'messages.json'),
	users: path.join(directories.users, 'users.json'),
	credentials: path.join(directories.credentials, 'credentials.json')
};

// Helper function to read data file
function readDataFile(filePath) {
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, 'utf8');
			return data ? JSON.parse(data) : [];
		}
		return [];
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		return [];
	}
}

// Helper function to write data file
function writeDataFile(filePath, data) {
	try {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		return true;
	} catch (error) {
		console.error(`Error writing file ${filePath}:`, error);
		return false;
	}
}

// IPC handlers for data operations
ipcMain.handle('getData', (event, dataType) => {
	const filePath = dataFiles[dataType];
	return readDataFile(filePath);
});

ipcMain.handle('saveData', (event, dataType, data) => {
	const filePath = dataFiles[dataType];
	return writeDataFile(filePath, data);
});

// Add this IPC handler to your existing handlers
ipcMain.handle('deleteAllData', async () => {
	try {
		// Delete all files in each data directory
		Object.values(directories).forEach(dir => {
			if (fs.existsSync(dir)) {
				const files = fs.readdirSync(dir);
				files.forEach(file => {
					const filePath = path.join(dir, file);
					fs.unlinkSync(filePath);
				});
			}
		});
		return true;
	} catch (error) {
		console.error('Error deleting data:', error);
		return false;
	}
});

// Migrate existing data if it exists in the old location
function migrateOldData() {
	const oldNotesDir = path.join(__dirname, 'notes');
	if (fs.existsSync(oldNotesDir)) {
		try {
			// Read all files from old directory
			const files = fs.readdirSync(oldNotesDir);
			files.forEach(file => {
				const oldPath = path.join(oldNotesDir, file);
				const fileData = fs.readFileSync(oldPath, 'utf8');
				
				// Determine new location based on file name
				const dataType = file.replace('.json', '');
				if (dataFiles[dataType]) {
					writeDataFile(dataFiles[dataType], JSON.parse(fileData));
				}
			});

			// Optionally, remove old directory after successful migration
			fs.rmSync(oldNotesDir, { recursive: true, force: true });
		} catch (error) {
			console.error('Error migrating old data:', error);
		}
	}
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1024,
		height: 768,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false,
			preload: path.join(__dirname, 'preload.js'),
			webSecurity: true
		}
	});

	// Change initial page to login.html
	win.loadFile(path.join(__dirname, 'src', 'login.html'));
}

// Add handler for saved credentials
ipcMain.handle('getSavedCredentials', async () => {
	try {
		const credentialsPath = dataFiles.credentials;
		return readDataFile(credentialsPath);
	} catch (error) {
		console.error('Error reading credentials:', error);
		return null;
	}
});

ipcMain.handle('saveCredentials', async (event, credentials) => {
	try {
		const credentialsPath = dataFiles.credentials;
		return writeDataFile(credentialsPath, credentials);
	} catch (error) {
		console.error('Error saving credentials:', error);
		return false;
	}
});

ipcMain.handle('clearCredentials', async () => {
	try {
		const credentialsPath = dataFiles.credentials;
		return writeDataFile(credentialsPath, {});
	} catch (error) {
		console.error('Error clearing credentials:', error);
		return false;
	}
});

// Run migration when app is ready
app.whenReady().then(() => {
	migrateOldData();
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});