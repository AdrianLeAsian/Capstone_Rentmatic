const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const config = require(path.join(__dirname, '..', 'config'));
const fs = require('fs').promises;

// Initialize the Gemini AI with error handling
let genAI;
try {
    if (!config.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
} catch (error) {
    console.error('Error initializing Gemini AI:', error);
    throw error;
}

class AIService {
    constructor() {
        try {
            this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
            console.log('Gemini model initialized successfully');
            
            // Initialize data paths
            this.dataPath = path.join(__dirname, '..', 'data');
            this.tenantsPath = path.join(this.dataPath, 'tenants.json');
            this.unitsPath = path.join(this.dataPath, 'units.json');
            this.paymentsPath = path.join(this.dataPath, 'payments.json');
            
            // Ensure data directory exists
            this.initializeDataStructure();
        } catch (error) {
            console.error('Error in AIService constructor:', error);
            throw error;
        }
    }

    async initializeDataStructure() {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(this.dataPath, { recursive: true });
            
            // Initialize files if they don't exist
            const files = {
                [this.tenantsPath]: [],
                [this.unitsPath]: [],
                [this.paymentsPath]: []
            };

            for (const [filePath, defaultData] of Object.entries(files)) {
                try {
                    await fs.access(filePath);
                } catch {
                    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                }
            }
        } catch (error) {
            console.error('Error initializing data structure:', error);
            throw error;
        }
    }

    // Data access methods
    async readData(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return null;
        }
    }

    async writeData(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing to ${filePath}:`, error);
            return false;
        }
    }

    // Tenant management methods
    async getTenants() {
        return await this.readData(this.tenantsPath);
    }

    async addTenant(tenantData) {
        const tenants = await this.getTenants();
        if (!tenants) return false;
        
        tenants.push({
            id: Date.now().toString(),
            ...tenantData,
            createdAt: new Date().toISOString()
        });
        
        return await this.writeData(this.tenantsPath, tenants);
    }

    // Unit management methods
    async getUnits() {
        return await this.readData(this.unitsPath);
    }

    async addUnit(unitData) {
        const units = await this.getUnits();
        if (!units) return false;
        
        units.push({
            id: Date.now().toString(),
            ...unitData,
            createdAt: new Date().toISOString()
        });
        
        return await this.writeData(this.unitsPath, units);
    }

    // Payment management methods
    async getPayments() {
        return await this.readData(this.paymentsPath);
    }

    async addPayment(paymentData) {
        const payments = await this.getPayments();
        if (!payments) return false;
        
        payments.push({
            id: Date.now().toString(),
            ...paymentData,
            createdAt: new Date().toISOString()
        });
        
        return await this.writeData(this.paymentsPath, payments);
    }

    // AI Assistant methods
    async sendMessage(message) {
        try {
            console.log('Sending message to Gemini:', message);
            if (!message || typeof message !== 'string') {
                throw new Error('Invalid message format');
            }

            // Add context about available data and actions
            const contextPrompt = `You are a property management AI assistant with access to the following data:
            - Tenant information
            - Unit details
            - Payment records
            
            User message: ${message}
            
            Please provide assistance based on this context.`;

            const result = await this.model.generateContent(contextPrompt);
            console.log('Received response from Gemini');
            const response = await result.response;
            
            // Process AI response for potential actions
            const responseText = response.text();
            await this.processAIResponse(responseText, message);
            
            return responseText;
        } catch (error) {
            console.error('Error in AI response:', error);
            if (error.message.includes('API key')) {
                return 'Error: Invalid or missing API key. Please check your configuration.';
            } else if (error.message.includes('not found')) {
                return 'Error: Unable to connect to Gemini API. Please check your internet connection and API configuration.';
            } else {
                return `Error: ${error.message}. Please try again.`;
            }
        }
    }

    async processAIResponse(aiResponse, userMessage) {
        try {
            // Check if the AI response suggests any actions
            if (aiResponse.toLowerCase().includes('add tenant')) {
                // Extract tenant information from the conversation
                const tenantInfo = await this.extractTenantInfo(userMessage);
                if (tenantInfo) {
                    await this.addTenant(tenantInfo);
                }
            }
            
            if (aiResponse.toLowerCase().includes('add unit')) {
                // Extract unit information from the conversation
                const unitInfo = await this.extractUnitInfo(userMessage);
                if (unitInfo) {
                    await this.addUnit(unitInfo);
                }
            }
            
            if (aiResponse.toLowerCase().includes('record payment')) {
                // Extract payment information from the conversation
                const paymentInfo = await this.extractPaymentInfo(userMessage);
                if (paymentInfo) {
                    await this.addPayment(paymentInfo);
                }
            }
        } catch (error) {
            console.error('Error processing AI response:', error);
        }
    }

    async extractTenantInfo(message) {
        try {
            const prompt = `Extract tenant information from this message: "${message}"
                Format the response as JSON with these fields:
                - name
                - email
                - phone
                - moveInDate
                Only return the JSON object, nothing else.`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error('Error extracting tenant info:', error);
            return null;
        }
    }

    async extractUnitInfo(message) {
        try {
            const prompt = `Extract unit information from this message: "${message}"
                Format the response as JSON with these fields:
                - unitNumber
                - type (apartment/house/etc)
                - bedrooms
                - bathrooms
                - rent
                Only return the JSON object, nothing else.`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error('Error extracting unit info:', error);
            return null;
        }
    }

    async extractPaymentInfo(message) {
        try {
            const prompt = `Extract payment information from this message: "${message}"
                Format the response as JSON with these fields:
                - tenantId
                - amount
                - paymentDate
                - paymentMethod
                Only return the JSON object, nothing else.`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error('Error extracting payment info:', error);
            return null;
        }
    }

    async generatePropertyDescription(propertyDetails) {
        try {
            console.log('Generating property description for:', propertyDetails);
            if (!propertyDetails || typeof propertyDetails !== 'object') {
                throw new Error('Invalid property details format');
            }

            const prompt = `Generate a professional property description for the following details:
                ${JSON.stringify(propertyDetails)}
                Make it engaging and highlight key features.`;
            
            const result = await this.model.generateContent(prompt);
            console.log('Received property description from Gemini');
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating property description:', error);
            return `Error: ${error.message}. Please try again.`;
        }
    }

    async suggestRentalPrice(propertyDetails, marketData) {
        try {
            console.log('Suggesting rental price for:', { propertyDetails, marketData });
            if (!propertyDetails || !marketData) {
                throw new Error('Missing property details or market data');
            }

            // Include existing rental data in the analysis
            const units = await this.getUnits();
            const prompt = `Based on the following information, suggest an optimal rental price:
                Property: ${JSON.stringify(propertyDetails)}
                Market Data: ${JSON.stringify(marketData)}
                Existing Units: ${JSON.stringify(units)}
                Provide a price range and explanation for the suggestion.`;
            
            const result = await this.model.generateContent(prompt);
            console.log('Received rental price suggestion from Gemini');
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error suggesting rental price:', error);
            return `Error: ${error.message}. Please try again.`;
        }
    }
}

module.exports = new AIService(); 