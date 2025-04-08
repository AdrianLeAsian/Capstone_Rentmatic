const { app } = require('electron');
const { migrateFromLocalStorage } = require('./db');
const sqlite = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Mock localStorage for migration
const localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
        return true;
    },
    removeItem: function(key) {
        delete this.data[key];
        return true;
    },
    clear: function() {
        this.data = {};
        return true;
    }
};

// Path to the localStorage export file
const exportPath = require('path').join(__dirname, 'localStorage_export.json');

// Check if file exists
if (require('fs').existsSync(exportPath)) {
    try {
        // Read and parse the export file
        const data = JSON.parse(require('fs').readFileSync(exportPath, 'utf8'));
        
        // Load data into mock localStorage
        for (const key in data) {
            localStorage.data[key] = data[key];
        }
        
        // Run migration
        migrateFromLocalStorage(localStorage)
            .then(success => {
                console.log('Migration completed:', success ? 'SUCCESS' : 'FAILED');
                app.quit();
            })
            .catch(err => {
                console.error('Migration error:', err);
                app.quit();
            });
    } catch (err) {
        console.error('Error reading export file:', err);
        app.quit();
    }
} else {
    console.error('Export file not found:', exportPath);
    app.quit();
} 