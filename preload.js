const { contextBridge, ipcRenderer } = require('electron');

// Define the API for the renderer process
contextBridge.exposeInMainWorld('api', {
<<<<<<< Updated upstream
	title: "My Notes App",
	createNote: (data) => ipcRenderer.invoke('create-file', data)
})
=======
	// User related functions
	getUsers: () => ipcRenderer.invoke('db:get-users'),
	createUser: (user) => ipcRenderer.invoke('db:create-user', user),
	verifyCredentials: (username, password) => ipcRenderer.invoke('db:verify-credentials', username, password),
	usernameExists: (username) => ipcRenderer.invoke('db:username-exists', username),
	
	// Tenant related functions
	getTenants: () => ipcRenderer.invoke('db:get-tenants'),
	getTenant: (id) => ipcRenderer.invoke('db:get-tenant', id),
	createTenant: (tenant) => ipcRenderer.invoke('db:create-tenant', tenant),
	updateTenant: (id, tenant) => ipcRenderer.invoke('db:update-tenant', id, tenant),
	deleteTenant: (id) => ipcRenderer.invoke('db:delete-tenant', id),
	
	// Building related functions
	getBuildings: () => ipcRenderer.invoke('db:get-buildings'),
	createBuilding: (building) => ipcRenderer.invoke('db:create-building', building),
	deleteBuilding: (id) => ipcRenderer.invoke('db:delete-building', id),
	
	// Unit related functions
	createUnit: (unit) => ipcRenderer.invoke('db:create-unit', unit),
	updateUnit: (id, unit) => ipcRenderer.invoke('db:update-unit', id, unit),
	deleteUnit: (id) => ipcRenderer.invoke('db:delete-unit', id),
	addUnitItem: (item) => ipcRenderer.invoke('db:add-unit-item', item),
	deleteUnitItem: (id) => ipcRenderer.invoke('db:delete-unit-item', id),
	
	// Financial related functions
	getFinancialEntries: () => ipcRenderer.invoke('db:get-financial-entries'),
	createFinancialEntry: (entry) => ipcRenderer.invoke('db:create-financial-entry', entry),
	deleteFinancialEntry: (id) => ipcRenderer.invoke('db:delete-financial-entry', id),
	
	// Chat related functions
	getChatHistory: (tenantId) => ipcRenderer.invoke('db:get-chat-history', tenantId),
	addChatMessage: (message) => ipcRenderer.invoke('db:add-chat-message', message),
	
	// Session storage (for current user, etc.)
	setCurrentUser: (user) => ipcRenderer.invoke('session:set-current-user', user),
	getCurrentUser: () => ipcRenderer.invoke('session:get-current-user'),
	removeCurrentUser: () => ipcRenderer.invoke('session:remove-current-user'),
	
	// For data export/import
	exportData: () => ipcRenderer.invoke('db:export-data'),
	importData: (data) => ipcRenderer.invoke('db:import-data', data),
	
	// For backward compatibility during the transition
	getItem: (key) => {
		console.warn('Using deprecated localStorage method. Please use the new db API.');
		return localStorage.getItem(key);
	},
	setItem: (key, value) => {
		console.warn('Using deprecated localStorage method. Please use the new db API.');
		try {
			localStorage.setItem(key, value);
			return true;
		} catch (error) {
			console.error('Error setting item in localStorage:', error);
			return false;
		}
	},
	removeItem: (key) => {
		console.warn('Using deprecated localStorage method. Please use the new db API.');
		try {
			localStorage.removeItem(key);
			return true;
		} catch (error) {
			console.error('Error removing item from localStorage:', error);
			return false;
		}
	}
});
>>>>>>> Stashed changes
