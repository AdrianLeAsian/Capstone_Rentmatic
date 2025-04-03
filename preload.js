const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	getItem: (key) => {
		try {
			return localStorage.getItem(key);
		} catch (error) {
			console.error('Error getting item from localStorage:', error);
			return null;
		}
	},
	setItem: (key, value) => {
		try {
			localStorage.setItem(key, value);
			return true;
		} catch (error) {
			console.error('Error setting item in localStorage:', error);
			return false;
		}
	},
	removeItem: (key) => {
		try {
			localStorage.removeItem(key);
			return true;
		} catch (error) {
			console.error('Error removing item from localStorage:', error);
			return false;
		}
	}
});