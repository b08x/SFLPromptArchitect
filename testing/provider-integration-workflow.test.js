#!/usr/bin/env node

const axios = require('axios');
const { generateCompletion } = require('../backend/dist/services/ai/aiSdkService.js');

// Configuration for providers and test scenarios
const PROVIDERS = ['openai', 'anthropic', 'google', 'openrouter', 'ollama', 'cohere', 'mistral', 'groq'];
const TEST_SCENARIOS = [
  {
    name: 'Basic Completion',
    prompt: 'Explain the concept of machine learning in one paragraph.',
    parameters: { temperature: 0.7, maxTokens: 200 }
  },
  {
    name: 'Structured Output',
    prompt: 'Generate a JSON profile for a software engineer.',
    parameters: { 
      temperature: 0.5, 
      jsonSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          yearsOfExperience: { type: 'number' }
        },
        required: ['name', 'skills']
      }
    }
  },
  {
    name: 'Function Calling',
    prompt: 'What is the current weather in New York?',
    parameters: {
      tools: [
        {
          name: 'get_weather',
          description: 'Get current weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
            },
            required: ['location']
          }
        }
      ]
    }
  }
];

async function runProviderIntegrationTests() {
  console.log('🌐 Provider Integration Workflow Tests\n');

  for (const provider of PROVIDERS) {
    console.log(`🔍 Testing Provider: ${provider.toUpperCase()}`);

    for (const scenario of TEST_SCENARIOS) {
      console.log(`\n📋 Scenario: ${scenario.name}`);

      try {
        const request = {
          provider,
          model: getModelForProvider(provider),
          prompt: scenario.prompt,
          ...scenario.parameters
        };

        console.log('Request Parameters:');
        console.log(JSON.stringify(request, null, 2));

        // Perform the API call
        const response = await generateCompletion(request);

        // Validate response
        validateResponse(provider, scenario.name, response);

        console.log(`✅ ${provider} - ${scenario.name}: Passed`);
      } catch (error) {
        console.error(`❌ ${provider} - ${scenario.name}: Failed`);
        console.error('Error Details:', error.message);
        
        // Log detailed error information
        if (error.response) {
          console.error('Response Status:', error.response.status);
          console.error('Response Data:', error.response.data);
        }
      }
    }

    console.log('\n-------------------\n');
  }

  console.log('🏁 Provider Integration Tests Complete');
}

function getModelForProvider(provider) {
  const providerModels = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
    openrouter: 'anthropic/claude-3-haiku',
    ollama: 'llama2',
    cohere: 'command-r',
    mistral: 'mistral-large-latest',
    groq: 'llama-3.1-70b-versatile'
  };
  return providerModels[provider] || 'default-model';
}

function validateResponse(provider, scenarioName, response) {
  // Basic validation common to all providers
  if (!response) {
    throw new Error('No response received');
  }

  // Specific validation based on scenario
  switch(scenarioName) {
    case 'Basic Completion':
      validateBasicCompletion(response);
      break;
    case 'Structured Output':
      validateStructuredOutput(response);
      break;
    case 'Function Calling':
      validateFunctionCalling(response);
      break;
    default:
      console.warn(`No specific validation for scenario: ${scenarioName}`);
  }
}

function validateBasicCompletion(response) {
  if (!response.text || response.text.length === 0) {
    throw new Error('Empty completion text');
  }
  if (response.text.length > 2000) {
    throw new Error('Completion text too long');
  }
}

function validateStructuredOutput(response) {
  if (!response.json) {
    throw new Error('No JSON output');
  }
  
  // Basic JSON schema validation
  if (typeof response.json !== 'object') {
    throw new Error('Invalid JSON structure');
  }
}

function validateFunctionCalling(response) {
  if (!response.functionCall) {
    throw new Error('No function call detected');
  }
  
  if (!response.functionCall.name || !response.functionCall.arguments) {
    throw new Error('Incomplete function call details');
  }
}

// Run the tests
runProviderIntegrationTests().catch(console.error);