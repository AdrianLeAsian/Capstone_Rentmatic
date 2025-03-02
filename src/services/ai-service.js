const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const config = require(path.join(__dirname, '..', 'config'));

// Initialize the Gemini AI with error handling
let genAI;
try {
    if (!config.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY, { apiVersion: 'v1beta3' });
    console.log('Gemini AI initialized successfully');
} catch (error) {
    console.error('Error initializing Gemini AI:', error);
    throw error;
}

class AIService {
    constructor() {
        try {
            // Using gemini-1.5-flash model as recommended
            this.model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            });
            console.log('Gemini model initialized successfully');
        } catch (error) {
            console.error('Error in AIService constructor:', error);
            throw error;
        }
    }

    async sendMessage(message) {
        try {
            console.log('Sending message to Gemini:', message);
            if (!message || typeof message !== 'string') {
                throw new Error('Invalid message format');
            }

            const parts = [{ text: message }];
            const result = await this.model.generateContent({ contents: [{ parts }] });
            console.log('Received response from Gemini');
            const response = await result.response;
            return response.text();
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

    async generatePropertyDescription(propertyDetails) {
        try {
            console.log('Generating property description for:', propertyDetails);
            if (!propertyDetails || typeof propertyDetails !== 'object') {
                throw new Error('Invalid property details format');
            }

            const text = `Generate a professional property description for the following details:
                ${JSON.stringify(propertyDetails)}
                Make it engaging and highlight key features.`;
            
            const parts = [{ text }];
            const result = await this.model.generateContent({ contents: [{ parts }] });
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

            const text = `Based on the following property details and market data, suggest an optimal rental price:
                Property: ${JSON.stringify(propertyDetails)}
                Market Data: ${JSON.stringify(marketData)}
                Provide a price range and explanation for the suggestion.`;
            
            const parts = [{ text }];
            const result = await this.model.generateContent({ contents: [{ parts }] });
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