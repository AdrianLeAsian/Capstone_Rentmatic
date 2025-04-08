const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { 
	userDb, tenantDb, buildingDb, unitDb, financeDb, chatDb, migrateFromLocalStorage 
} = require('./db');

// In-memory session storage
const sessionStorage = {
	currentUser: null
};

function createWindow () {
	const win = new BrowserWindow({
		width: 768,
		height: 560,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	});

	ipcMain.handle('create-file', (req, data) => {
		if (!data || !data.title || !data.content) return false;

		const filePath = path.join(__dirname, 'notes', `${data.title}.txt`);
		fs.writeFileSync(filePath, data.content);

		return { success: true, filePath };
	})

	win.loadFile('src/dashboard.html');
}

<<<<<<< Updated upstream
app.whenReady().then(createWindow);
=======
// Handle app ready
app.whenReady().then(() => {
	// Register IPC handlers for database operations
	registerIpcHandlers();
	
	// Create the main window
	createWindow();
>>>>>>> Stashed changes

app.on('window-all-closed', () => {
<<<<<<< Updated upstream
	if (process.platform !== 'darwin') app.quit();
})
=======
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	console.error('An uncaught error occurred:', error);
});

// Register all IPC handlers for database operations
function registerIpcHandlers() {
	// User-related handlers
	ipcMain.handle('db:get-users', async () => {
		try {
			return await userDb.getAll();
		} catch (err) {
			console.error('Error getting users:', err);
			return [];
		}
	});

	ipcMain.handle('db:create-user', async (event, user) => {
		try {
			return await userDb.create(user);
		} catch (err) {
			console.error('Error creating user:', err);
			return null;
		}
	});

	ipcMain.handle('db:verify-credentials', async (event, username, password) => {
		try {
			return await userDb.verifyCredentials(username, password);
		} catch (err) {
			console.error('Error verifying credentials:', err);
			return null;
		}
	});

	ipcMain.handle('db:username-exists', async (event, username) => {
		try {
			return await userDb.usernameExists(username);
		} catch (err) {
			console.error('Error checking username:', err);
			return false;
		}
	});

	// Tenant-related handlers
	ipcMain.handle('db:get-tenants', async () => {
		try {
			return await tenantDb.getAll();
		} catch (err) {
			console.error('Error getting tenants:', err);
			return [];
		}
	});

	ipcMain.handle('db:get-tenant', async (event, id) => {
		try {
			return await tenantDb.getById(id);
		} catch (err) {
			console.error('Error getting tenant:', err);
			return null;
		}
	});

	ipcMain.handle('db:create-tenant', async (event, tenant) => {
		try {
			return await tenantDb.create(tenant);
		} catch (err) {
			console.error('Error creating tenant:', err);
			return null;
		}
	});

	ipcMain.handle('db:update-tenant', async (event, id, tenant) => {
		try {
			return await tenantDb.update(id, tenant);
		} catch (err) {
			console.error('Error updating tenant:', err);
			return null;
		}
	});

	ipcMain.handle('db:delete-tenant', async (event, id) => {
		try {
			return await tenantDb.delete(id);
		} catch (err) {
			console.error('Error deleting tenant:', err);
			return { id, deleted: false };
		}
	});

	// Building-related handlers
	ipcMain.handle('db:get-buildings', async () => {
		try {
			return await buildingDb.getAll();
		} catch (err) {
			console.error('Error getting buildings:', err);
			return [];
		}
	});

	ipcMain.handle('db:create-building', async (event, building) => {
		try {
			return await buildingDb.create(building);
		} catch (err) {
			console.error('Error creating building:', err);
			return null;
		}
	});

	ipcMain.handle('db:delete-building', async (event, id) => {
		try {
			return await buildingDb.delete(id);
		} catch (err) {
			console.error('Error deleting building:', err);
			return { id, deleted: false };
		}
	});

	// Unit-related handlers
	ipcMain.handle('db:create-unit', async (event, unit) => {
		try {
			return await unitDb.create(unit);
		} catch (err) {
			console.error('Error creating unit:', err);
			return null;
		}
	});

	ipcMain.handle('db:update-unit', async (event, id, unit) => {
		try {
			return await unitDb.update(id, unit);
		} catch (err) {
			console.error('Error updating unit:', err);
			return null;
		}
	});

	ipcMain.handle('db:delete-unit', async (event, id) => {
		try {
			return await unitDb.delete(id);
		} catch (err) {
			console.error('Error deleting unit:', err);
			return { id, deleted: false };
		}
	});

	ipcMain.handle('db:add-unit-item', async (event, item) => {
		try {
			return await unitDb.addItem(item);
		} catch (err) {
			console.error('Error adding unit item:', err);
			return null;
		}
	});

	ipcMain.handle('db:delete-unit-item', async (event, id) => {
		try {
			return await unitDb.deleteItem(id);
		} catch (err) {
			console.error('Error deleting unit item:', err);
			return { id, deleted: false };
		}
	});

	// Financial-related handlers
	ipcMain.handle('db:get-financial-entries', async () => {
		try {
			return await financeDb.getAll();
		} catch (err) {
			console.error('Error getting financial entries:', err);
			return [];
		}
	});

	ipcMain.handle('db:create-financial-entry', async (event, entry) => {
		try {
			return await financeDb.create(entry);
		} catch (err) {
			console.error('Error creating financial entry:', err);
			return null;
		}
	});

	ipcMain.handle('db:delete-financial-entry', async (event, id) => {
		try {
			return await financeDb.delete(id);
		} catch (err) {
			console.error('Error deleting financial entry:', err);
			return { id, deleted: false };
		}
	});

	// Chat-related handlers
	ipcMain.handle('db:get-chat-history', async (event, tenantId) => {
		try {
			return await chatDb.getByTenantId(tenantId);
		} catch (err) {
			console.error('Error getting chat history:', err);
			return [];
		}
	});

	ipcMain.handle('db:add-chat-message', async (event, message) => {
		try {
			return await chatDb.addMessage(message);
		} catch (err) {
			console.error('Error adding chat message:', err);
			return null;
		}
	});

	// Session storage handlers (for current user, etc.)
	ipcMain.handle('session:set-current-user', (event, user) => {
		sessionStorage.currentUser = user;
		return true;
	});

	ipcMain.handle('session:get-current-user', () => {
		return sessionStorage.currentUser;
	});

	ipcMain.handle('session:remove-current-user', () => {
		sessionStorage.currentUser = null;
		return true;
	});

	// Data export/import handlers
	ipcMain.handle('db:export-data', async () => {
		try {
			const data = {
				users: await userDb.getAll(),
				tenants: await tenantDb.getAll(),
				buildings: await buildingDb.getAll(),
				finances: await financeDb.getAll()
			};
			return data;
		} catch (err) {
			console.error('Error exporting data:', err);
			return null;
		}
	});

	ipcMain.handle('db:import-data', async (event, data) => {
		try {
			// Implementation would depend on the structure of the data
			// This is a simplified example
			if (data.users) {
				for (const user of data.users) {
					await userDb.create(user);
				}
			}

			if (data.tenants) {
				for (const tenant of data.tenants) {
					await tenantDb.create(tenant);
				}
			}

			if (data.buildings) {
				for (const building of data.buildings) {
					await buildingDb.create(building);
					
					if (building.units) {
						for (const unit of building.units) {
							await unitDb.create({
								...unit,
								buildingId: building.id
							});
							
							if (unit.items) {
								for (const item of unit.items) {
									await unitDb.addItem({
										...item,
										unitId: unit.id
									});
								}
							}
						}
					}
				}
			}

			if (data.finances) {
				for (const entry of data.finances) {
					await financeDb.create(entry);
				}
			}

			return true;
		} catch (err) {
			console.error('Error importing data:', err);
			return false;
		}
	});

	// Legacy file operations
	ipcMain.handle('create-file', (event, data) => {
		if (!data || !data.title || !data.content) return false;

		const filePath = path.join(__dirname, 'notes', `${data.title}.txt`);
		fs.writeFileSync(filePath, data.content);

		return { success: true, filePath };
	});
}

>>>>>>> Stashed changes
