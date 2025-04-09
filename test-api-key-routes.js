// Simple script to test API key routes
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3003';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid auth token
const MERCHANT_ID = 'cm99c3aac0001xpj2ryuokh3w'; // Use the merchant ID from the test script

// Test creating an API key
async function testCreateApiKey() {
  try {
    console.log('Testing API key creation...');
    const response = await axios.post(`${API_URL}/api/api-keys`, {
      name: 'Test API Key from Script',
      environment: 'test',
      merchantId: MERCHANT_ID
    }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API key created successfully:');
    console.log(response.data);
    return response.data.data.key;
  } catch (error) {
    console.error('Failed to create API key:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

// Test getting API keys
async function testGetApiKeys() {
  try {
    console.log('Testing API key retrieval...');
    const response = await axios.get(`${API_URL}/api/api-keys`, {
      params: { merchantId: MERCHANT_ID },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('API keys retrieved successfully:');
    console.log(response.data);
  } catch (error) {
    console.error('Failed to retrieve API keys:');
    console.error(error.response ? error.response.data : error.message);
  }
}

// Test getting API key stats
async function testGetApiKeyStats() {
  try {
    console.log('Testing API key stats retrieval...');
    const response = await axios.get(`${API_URL}/api/api-keys/stats`, {
      params: { 
        merchantId: MERCHANT_ID,
        timeWindow: '30d'
      },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('API key stats retrieved successfully:');
    console.log(response.data);
  } catch (error) {
    console.error('Failed to retrieve API key stats:');
    console.error(error.response ? error.response.data : error.message);
  }
}

// Run the tests
async function runTests() {
  // Test getting API keys
  await testGetApiKeys();
  
  // Test getting API key stats
  await testGetApiKeyStats();
}

runTests();
