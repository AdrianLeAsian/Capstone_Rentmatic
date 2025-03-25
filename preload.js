const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const aiService = require(path.join(__dirname, 'src', 'services', 'ai-service'));

contextBridge.exposeInMainWorld('api', {
	title: "My Notes App",
	createNote: (data) => ipcRenderer.invoke('create-file', data),
	ai: {
		sendMessage: (message) => aiService.sendMessage(message),
		generatePropertyDescription: (details) => aiService.generatePropertyDescription(details),
		suggestRentalPrice: (details, marketData) => aiService.suggestRentalPrice(details, marketData)
	}
})

contextBridge.exposeInMainWorld('dataAPI', {
	getData: (dataType) => ipcRenderer.invoke('getData', dataType),
	saveData: (dataType, data) => ipcRenderer.invoke('saveData', dataType, data),
	deleteAllData: () => ipcRenderer.invoke('deleteAllData'),
	getSavedCredentials: () => ipcRenderer.invoke('getSavedCredentials'),
	saveCredentials: (credentials) => ipcRenderer.invoke('saveCredentials', credentials),
	clearCredentials: () => ipcRenderer.invoke('clearCredentials')
});