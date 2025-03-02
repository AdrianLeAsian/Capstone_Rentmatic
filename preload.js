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