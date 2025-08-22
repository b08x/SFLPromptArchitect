/**
 * Test script for dynamic provider switching functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testProviderSwitching() {
  console.log('🧪 Testing Dynamic Provider Switching\n');

  // Test 1: Legacy Gemini endpoint (should default to Google/Gemini)
  console.log('Test 1: Legacy Gemini endpoint (backward compatibility)');
  try {
    const response = await axios.post(`${BASE_URL}/gemini/test-prompt`, {
      promptText: 'Say "Hello from legacy endpoint" in a friendly way.'
    });
    console.log('✅ Legacy endpoint response:', response.data.text.substring(0, 100) + '...\n');
  } catch (error) {
    console.log('❌ Legacy endpoint failed:', error.response?.data || error.message, '\n');
  }

  // Test 2: Dynamic provider switching to OpenAI (if API key available)
  if (process.env.OPENAI_API_KEY) {
    console.log('Test 2: Dynamic provider switching to OpenAI');
    try {
      const response = await axios.post(`${BASE_URL}/gemini/test-prompt`, {
        promptText: 'Say "Hello from OpenAI" in a friendly way.',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.7,
          maxTokens: 100
        },
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI response:', response.data.text.substring(0, 100) + '...\n');
    } catch (error) {
      console.log('❌ OpenAI request failed:', error.response?.data || error.message, '\n');
    }
  } else {
    console.log('⚠️ Skipping OpenAI test - no API key provided\n');
  }

  // Test 3: Dynamic provider switching to Anthropic (if API key available)
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('Test 3: Dynamic provider switching to Anthropic');
    try {
      const response = await axios.post(`${BASE_URL}/gemini/test-prompt`, {
        promptText: 'Say "Hello from Anthropic" in a friendly way.',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        parameters: {
          temperature: 0.7,
          maxTokens: 100
        },
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log('✅ Anthropic response:', response.data.text.substring(0, 100) + '...\n');
    } catch (error) {
      console.log('❌ Anthropic request failed:', error.response?.data || error.message, '\n');
    }
  } else {
    console.log('⚠️ Skipping Anthropic test - no API key provided\n');
  }

  // Test 4: SFL Generation with dynamic provider
  console.log('Test 4: SFL Generation with dynamic provider');
  try {
    const response = await axios.post(`${BASE_URL}/gemini/generate-sfl`, {
      goal: 'Write a professional email to a client',
      provider: 'google', // Use Google/Gemini for this test
      model: 'gemini-2.5-flash',
      parameters: {
        temperature: 0.7,
        maxTokens: 2048
      }
    });
    console.log('✅ SFL Generation successful, title:', response.data.title, '\n');
  } catch (error) {
    console.log('❌ SFL Generation failed:', error.response?.data || error.message, '\n');
  }

  // Test 5: Provider validation
  console.log('Test 5: Provider validation');
  try {
    const response = await axios.get(`${BASE_URL}/providers/available`);
    console.log('✅ Available providers:', response.data, '\n');
  } catch (error) {
    console.log('❌ Provider validation failed:', error.response?.data || error.message, '\n');
  }

  console.log('🏁 Testing complete!');
}

// Run the tests
if (require.main === module) {
  testProviderSwitching().catch(console.error);
}

module.exports = { testProviderSwitching };