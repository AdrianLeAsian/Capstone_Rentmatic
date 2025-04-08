const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Note: using bcryptjs (pure JS) instead of bcrypt (native)

// Database directory
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// Database files
const DB_FILES = {
    USERS: path.join(dbDir, 'users.json'),
    TENANTS: path.join(dbDir, 'tenants.json'),
    BUILDINGS: path.join(dbDir, 'buildings.json'),
    UNITS: path.join(dbDir, 'units.json'),
    UNIT_ITEMS: path.join(dbDir, 'unit_items.json'),
    FINANCIAL_ENTRIES: path.join(dbDir, 'financial_entries.json'),
    CHAT_HISTORY: path.join(dbDir, 'chat_history.json')
};

// Helper functions to read and write data
function readData(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading from ${filePath}:`, err);
        return [];
    }
}

function writeData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`Error writing to ${filePath}:`, err);
        return false;
    }
}

// Initialize database files
function initDb() {
    // Create empty files if they don't exist
    Object.values(DB_FILES).forEach(filePath => {
        if (!fs.existsSync(filePath)) {
            writeData(filePath, []);
        }
    });
    console.log('Database files initialized');
}

// User-related functions
const userDb = {
    // Get all users
    getAll: () => {
        const users = readData(DB_FILES.USERS);
        // Remove passwords from the response
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    },

    // Get user by id
    getById: (id) => {
        const users = readData(DB_FILES.USERS);
        const user = users.find(u => u.id === id);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    },

    // Create new user
    create: async (user) => {
        const users = readData(DB_FILES.USERS);
        
        // Check if username already exists
        if (users.some(u => u.username === user.username)) {
            throw new Error('Username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Create new user object
        const newUser = {
            id: Date.now().toString(),
            name: user.name,
            email: user.email,
            username: user.username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        // Add to users array
        users.push(newUser);
        
        // Save to file
        if (writeData(DB_FILES.USERS, users)) {
            const { password, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        }
        
        throw new Error('Failed to save user');
    },

    // Check if username exists
    usernameExists: (username) => {
        const users = readData(DB_FILES.USERS);
        return users.some(u => u.username === username);
    },

    // Verify user credentials
    verifyCredentials: async (username, password) => {
        const users = readData(DB_FILES.USERS);
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return null;
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (passwordMatch) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        
        return null;
    }
};

// Tenant-related functions
const tenantDb = {
    // Get all tenants
    getAll: () => {
        return readData(DB_FILES.TENANTS);
    },

    // Get tenant by id
    getById: (id) => {
        const tenants = readData(DB_FILES.TENANTS);
        return tenants.find(t => t.id === id) || null;
    },

    // Create new tenant
    create: (tenant) => {
        const tenants = readData(DB_FILES.TENANTS);
        tenants.push(tenant);
        
        if (writeData(DB_FILES.TENANTS, tenants)) {
            return tenant;
        }
        
        throw new Error('Failed to save tenant');
    },

    // Update tenant
    update: (id, tenant) => {
        const tenants = readData(DB_FILES.TENANTS);
        const index = tenants.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error('Tenant not found');
        }
        
        // Update tenant data
        tenants[index] = { ...tenant, id };
        
        if (writeData(DB_FILES.TENANTS, tenants)) {
            return tenants[index];
        }
        
        throw new Error('Failed to update tenant');
    },

    // Delete tenant
    delete: (id) => {
        const tenants = readData(DB_FILES.TENANTS);
        const filteredTenants = tenants.filter(t => t.id !== id);
        
        if (writeData(DB_FILES.TENANTS, filteredTenants)) {
            return { id, deleted: true };
        }
        
        throw new Error('Failed to delete tenant');
    }
};

// Building-related functions
const buildingDb = {
    // Get all buildings with their units
    getAll: () => {
        const buildings = readData(DB_FILES.BUILDINGS);
        const units = readData(DB_FILES.UNITS);
        const unitItems = readData(DB_FILES.UNIT_ITEMS);
        
        // Add units to each building
        return buildings.map(building => {
            const buildingUnits = units.filter(u => u.buildingId === building.id).map(unit => {
                // Add items to each unit
                const items = unitItems.filter(item => item.unitId === unit.id);
                return { ...unit, items };
            });
            
            return { ...building, units: buildingUnits };
        });
    },

    // Create new building
    create: (building) => {
        const buildings = readData(DB_FILES.BUILDINGS);
        
        // Create new building with createdAt
        const newBuilding = {
            ...building,
            createdAt: new Date().toISOString()
        };
        
        buildings.push(newBuilding);
        
        if (writeData(DB_FILES.BUILDINGS, buildings)) {
            return { ...newBuilding, units: [] };
        }
        
        throw new Error('Failed to save building');
    },

    // Delete building
    delete: (id) => {
        const buildings = readData(DB_FILES.BUILDINGS);
        const units = readData(DB_FILES.UNITS);
        const unitItems = readData(DB_FILES.UNIT_ITEMS);
        
        // Filter out the building to delete
        const filteredBuildings = buildings.filter(b => b.id !== id);
        
        // Get unit IDs for this building to delete their items
        const buildingUnitIds = units
            .filter(u => u.buildingId === id)
            .map(u => u.id);
        
        // Filter out units for the deleted building
        const filteredUnits = units.filter(u => u.buildingId !== id);
        
        // Filter out unit items for the deleted units
        const filteredUnitItems = unitItems.filter(item => !buildingUnitIds.includes(item.unitId));
        
        // Save all filtered data
        const success = writeData(DB_FILES.BUILDINGS, filteredBuildings) &&
                        writeData(DB_FILES.UNITS, filteredUnits) &&
                        writeData(DB_FILES.UNIT_ITEMS, filteredUnitItems);
        
        if (success) {
            return { id, deleted: true };
        }
        
        throw new Error('Failed to delete building');
    }
};

// Unit-related functions
const unitDb = {
    // Create new unit
    create: (unit) => {
        const units = readData(DB_FILES.UNITS);
        units.push(unit);
        
        if (writeData(DB_FILES.UNITS, units)) {
            return unit;
        }
        
        throw new Error('Failed to save unit');
    },

    // Update unit
    update: (id, unit) => {
        const units = readData(DB_FILES.UNITS);
        const index = units.findIndex(u => u.id === id);
        
        if (index === -1) {
            throw new Error('Unit not found');
        }
        
        // Update unit data
        units[index] = { ...unit, id };
        
        if (writeData(DB_FILES.UNITS, units)) {
            return units[index];
        }
        
        throw new Error('Failed to update unit');
    },

    // Delete unit
    delete: (id) => {
        const units = readData(DB_FILES.UNITS);
        const unitItems = readData(DB_FILES.UNIT_ITEMS);
        
        // Filter out the unit to delete
        const filteredUnits = units.filter(u => u.id !== id);
        
        // Filter out unit items for the deleted unit
        const filteredUnitItems = unitItems.filter(item => item.unitId !== id);
        
        // Save filtered data
        const success = writeData(DB_FILES.UNITS, filteredUnits) &&
                        writeData(DB_FILES.UNIT_ITEMS, filteredUnitItems);
        
        if (success) {
            return { id, deleted: true };
        }
        
        throw new Error('Failed to delete unit');
    },

    // Add item to unit
    addItem: (item) => {
        const unitItems = readData(DB_FILES.UNIT_ITEMS);
        unitItems.push(item);
        
        if (writeData(DB_FILES.UNIT_ITEMS, unitItems)) {
            return item;
        }
        
        throw new Error('Failed to save unit item');
    },

    // Delete item from unit
    deleteItem: (id) => {
        const unitItems = readData(DB_FILES.UNIT_ITEMS);
        const filteredItems = unitItems.filter(item => item.id !== id);
        
        if (writeData(DB_FILES.UNIT_ITEMS, filteredItems)) {
            return { id, deleted: true };
        }
        
        throw new Error('Failed to delete unit item');
    }
};

// Financial entry functions
const financeDb = {
    // Get all financial entries
    getAll: () => {
        return readData(DB_FILES.FINANCIAL_ENTRIES);
    },

    // Add financial entry
    create: (entry) => {
        const entries = readData(DB_FILES.FINANCIAL_ENTRIES);
        entries.push(entry);
        
        if (writeData(DB_FILES.FINANCIAL_ENTRIES, entries)) {
            return entry;
        }
        
        throw new Error('Failed to save financial entry');
    },

    // Delete financial entry
    delete: (id) => {
        const entries = readData(DB_FILES.FINANCIAL_ENTRIES);
        const filteredEntries = entries.filter(e => e.id !== id);
        
        if (writeData(DB_FILES.FINANCIAL_ENTRIES, filteredEntries)) {
            return { id, deleted: true };
        }
        
        throw new Error('Failed to delete financial entry');
    }
};

// Chat history functions
const chatDb = {
    // Get chat history for a tenant
    getByTenantId: (tenantId) => {
        const chatHistory = readData(DB_FILES.CHAT_HISTORY);
        return chatHistory.filter(msg => msg.tenantId === tenantId);
    },

    // Add chat message
    addMessage: (message) => {
        const chatHistory = readData(DB_FILES.CHAT_HISTORY);
        const newMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...message
        };
        
        chatHistory.push(newMessage);
        
        if (writeData(DB_FILES.CHAT_HISTORY, chatHistory)) {
            return newMessage;
        }
        
        throw new Error('Failed to save chat message');
    }
};

// Function to migrate data from localStorage to our file-based DB
async function migrateFromLocalStorage(localStorage) {
    try {
        // Migrate users
        const usersStr = localStorage.getItem('users');
        if (usersStr) {
            const users = JSON.parse(usersStr);
            const existingUsers = readData(DB_FILES.USERS);
            
            // Only add users that don't already exist
            for (const user of users) {
                if (!existingUsers.some(u => u.username === user.username)) {
                    // We need to re-hash passwords if they weren't hashed before
                    const hashedPassword = user.password.startsWith('$2') 
                        ? user.password  // Already hashed
                        : await bcrypt.hash(user.password, 10);
                        
                    existingUsers.push({
                        id: user.id || Date.now().toString(),
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        password: hashedPassword,
                        createdAt: user.createdAt || new Date().toISOString()
                    });
                }
            }
            
            writeData(DB_FILES.USERS, existingUsers);
        }

        // Migrate tenants
        const tenantsStr = localStorage.getItem('tenants');
        if (tenantsStr) {
            const tenants = JSON.parse(tenantsStr);
            writeData(DB_FILES.TENANTS, tenants);
        }

        // Migrate buildings and units
        const buildingsStr = localStorage.getItem('buildings');
        if (buildingsStr) {
            const buildings = JSON.parse(buildingsStr);
            
            // Extract units and unit items from the buildings
            const units = [];
            const unitItems = [];
            
            // Extract buildings without units
            const buildingsWithoutUnits = buildings.map(building => {
                const { units: buildingUnits, ...buildingData } = building;
                
                if (buildingUnits && buildingUnits.length > 0) {
                    buildingUnits.forEach(unit => {
                        const { items, ...unitData } = unit;
                        
                        // Add unit to units array
                        units.push({
                            ...unitData,
                            buildingId: building.id
                        });
                        
                        // Add items to unitItems array
                        if (items && items.length > 0) {
                            items.forEach(item => {
                                unitItems.push({
                                    ...item,
                                    unitId: unit.id
                                });
                            });
                        }
                    });
                }
                
                return buildingData;
            });
            
            // Save separated data
            writeData(DB_FILES.BUILDINGS, buildingsWithoutUnits);
            writeData(DB_FILES.UNITS, units);
            writeData(DB_FILES.UNIT_ITEMS, unitItems);
        }

        // Migrate financial entries
        const entriesStr = localStorage.getItem('chartEntries');
        if (entriesStr) {
            const entries = JSON.parse(entriesStr);
            const formattedEntries = entries.map(entry => ({
                id: entry.id || Date.now().toString(),
                type: entry.type,
                description: entry.description,
                amount: entry.amount,
                timestamp: entry.timestamp || new Date().toISOString()
            }));
            
            writeData(DB_FILES.FINANCIAL_ENTRIES, formattedEntries);
        }

        // Migrate chat history
        const chatHistoryStr = localStorage.getItem('chatHistory');
        if (chatHistoryStr) {
            const chatHistory = JSON.parse(chatHistoryStr);
            const messages = [];
            
            // Convert the object format to array format
            for (const tenantId in chatHistory) {
                const tenantMessages = chatHistory[tenantId];
                tenantMessages.forEach(msg => {
                    messages.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        tenantId,
                        message: msg.text,
                        sender: msg.sender,
                        timestamp: msg.timestamp || new Date().toISOString()
                    });
                });
            }
            
            writeData(DB_FILES.CHAT_HISTORY, messages);
        }

        console.log('Data migration completed successfully');
        return true;
    } catch (err) {
        console.error('Error during migration:', err);
        return false;
    }
}

// Initialize the database
initDb();

// Export database functions
module.exports = {
    userDb,
    tenantDb,
    buildingDb,
    unitDb,
    financeDb,
    chatDb,
    migrateFromLocalStorage
}; 