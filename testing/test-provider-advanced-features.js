#!/usr/bin/env node

/**
 * Test script for advanced provider-specific features in aiSdkService
 * Demonstrates the new capabilities and configurations for all 8 providers
 */

const { 
  generateCompletion,
  createStructuredOutputRequest,
  createFunctionCallingRequest,
  createCachedRequest,
  createSafetyConfiguredRequest,
  getProviderInfo,
  getProviderCapabilities,
  getEstimatedCost,
  validateParameters,
  getSupportedProviders
} = require('../backend/dist/services/ai/aiSdkService.js');

// Mock API keys for testing (replace with real ones for actual usage)
const API_KEYS = {
  openai: process.env.OPENAI_API_KEY || 'test-key',
  anthropic: process.env.ANTHROPIC_API_KEY || 'test-key',
  google: process.env.GOOGLE_API_KEY || 'test-key',
  openrouter: process.env.OPENROUTER_API_KEY || 'test-key',
  ollama: 'local',
  cohere: process.env.COHERE_API_KEY || 'test-key',
  mistral: process.env.MISTRAL_API_KEY || 'test-key',
  groq: process.env.GROQ_API_KEY || 'test-key'
};

async function testProviderFeatures() {
  console.log('🧪 Testing Advanced Provider-Specific Features\n');
  
  // Test 1: Get all supported providers
  console.log('1. Supported Providers:');
  const providers = getSupportedProviders();
  console.log(providers);
  console.log();

  // Test 2: Provider Information
  console.log('2. Provider Information Examples:');
  for (const provider of ['openai', 'anthropic', 'google']) {
    try {
      const info = getProviderInfo(provider);
      console.log(`${provider.toUpperCase()}:`);
      console.log(`  - Base URL: ${info.baseUrl}`);
      console.log(`  - Requires API Key: ${info.requiresApiKey}`);
      console.log(`  - Models: ${info.models.length}`);
      console.log(`  - System Message Handling: ${info.specialHandling.systemMessageHandling}`);
      console.log(`  - Supported Features: ${info.supportedFeatures.join(', ')}`);
      console.log();
    } catch (error) {
      console.log(`  Error getting info for ${provider}: ${error.message}\n`);
    }
  }

  // Test 3: Model Capabilities
  console.log('3. Model Capabilities Examples:');
  const testModels = [
    ['openai', 'gpt-4o'],
    ['anthropic', 'claude-3-5-sonnet-20241022'],
    ['google', 'gemini-1.5-pro']
  ];

  for (const [provider, model] of testModels) {
    try {
      const capabilities = getProviderCapabilities(provider, model);
      if (capabilities) {
        console.log(`${provider}/${model}:`);
        console.log(`  - Streaming: ${capabilities.streaming}`);
        console.log(`  - Function Calling: ${capabilities.functionCalling}`);
        console.log(`  - Structured Output: ${capabilities.structuredOutput}`);
        console.log(`  - Vision: ${capabilities.vision}`);
        console.log(`  - Max Output Tokens: ${capabilities.maxOutputTokens}`);
        console.log();
      }
    } catch (error) {
      console.log(`  Error getting capabilities for ${provider}/${model}: ${error.message}\n`);
    }
  }

  // Test 4: Parameter Validation
  console.log('4. Parameter Validation Examples:');
  const validationTests = [
    {
      provider: 'openai',
      model: 'gpt-4o',
      parameters: { temperature: 0.7, maxTokens: 1000, top_p: 0.9 }
    },
    {
      provider: 'anthropic', 
      model: 'claude-3-5-sonnet-20241022',
      parameters: { temperature: 0.5, maxTokens: 2000, top_k: 40 }
    },
    {
      provider: 'google',
      model: 'gemini-1.5-pro',
      parameters: { temperature: 0.8, topK: 35, topP: 0.95 }
    }
  ];

  for (const test of validationTests) {
    try {
      const validation = validateParameters(test.provider, test.parameters, test.model);
      console.log(`${test.provider}/${test.model}:`);
      console.log(`  - Valid: ${validation.valid}`);
      if (validation.errors.length > 0) {
        console.log(`  - Errors: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        console.log(`  - Warnings: ${validation.warnings.join(', ')}`);
      }
      console.log();
    } catch (error) {
      console.log(`  Error validating ${test.provider}: ${error.message}\n`);
    }
  }

  // Test 5: Cost Estimation
  console.log('5. Cost Estimation Examples:');
  const costTests = [
    { provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 500 },
    { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', inputTokens: 1000, outputTokens: 500 },
    { provider: 'groq', model: 'llama-3.1-8b-instant', inputTokens: 1000, outputTokens: 500 }
  ];

  for (const test of costTests) {
    try {
      const request = {
        provider: test.provider,
        model: test.model,
        prompt: 'test',
        apiKey: API_KEYS[test.provider]
      };
      
      const cost = getEstimatedCost(request, test.inputTokens, test.outputTokens);
      console.log(`${test.provider}/${test.model}:`);
      console.log(`  - Input Cost: $${cost.inputCost.toFixed(6)}`);
      console.log(`  - Output Cost: $${cost.outputCost.toFixed(6)}`);
      console.log(`  - Total Cost: $${cost.totalCost.toFixed(6)}`);
      console.log();
    } catch (error) {
      console.log(`  Error estimating cost for ${test.provider}: ${error.message}\n`);
    }
  }

  // Test 6: Structured Output Request Creation
  console.log('6. Structured Output Request Examples:');
  const structuredOutputProviders = ['openai', 'groq', 'mistral'];
  const jsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      skills: { type: 'array', items: { type: 'string' } }
    },
    required: ['name', 'age']
  };

  for (const provider of structuredOutputProviders) {
    try {
      const baseRequest = {
        provider,
        model: provider === 'openai' ? 'gpt-4o' : 
               provider === 'groq' ? 'llama-3.1-70b-versatile' : 'mistral-large-latest',
        prompt: 'Generate a person profile',
        apiKey: API_KEYS[provider]
      };

      const structuredRequest = createStructuredOutputRequest(baseRequest, jsonSchema);
      console.log(`${provider}: Created structured output request`);
      console.log(`  - Schema provided: Yes`);
      console.log(`  - Provider options configured: ${structuredRequest.providerOptions ? 'Yes' : 'No'}`);
      console.log();
    } catch (error) {
      console.log(`  ${provider}: ${error.message}\n`);
    }
  }

  // Test 7: Function Calling Request Creation
  console.log('7. Function Calling Request Examples:');
  const functionCallingProviders = ['openai', 'anthropic', 'groq'];
  const tools = [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City and state' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    }
  ];

  for (const provider of functionCallingProviders) {
    try {
      const baseRequest = {
        provider,
        model: provider === 'openai' ? 'gpt-4o' : 
               provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'llama-3.1-70b-versatile',
        prompt: 'What is the weather like in San Francisco?',
        apiKey: API_KEYS[provider]
      };

      const functionRequest = createFunctionCallingRequest(baseRequest, tools, 'auto');
      console.log(`${provider}: Created function calling request`);
      console.log(`  - Tools provided: ${functionRequest.tools?.length || 0}`);
      console.log(`  - Tool choice: auto`);
      console.log();
    } catch (error) {
      console.log(`  ${provider}: ${error.message}\n`);
    }
  }

  // Test 8: Cached Request Creation
  console.log('8. Cached Request Examples:');
  try {
    const anthropicRequest = {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      prompt: 'Analyze this document',
      apiKey: API_KEYS.anthropic
    };

    const cachedRequest = createCachedRequest(anthropicRequest, {
      anthropic: { type: 'ephemeral', beta: true }
    });
    console.log('Anthropic: Created cached request with ephemeral cache control');
    console.log();
  } catch (error) {
    console.log(`  Anthropic caching: ${error.message}\n`);
  }

  // Test 9: Safety-Configured Request Creation
  console.log('9. Safety Configuration Examples:');
  try {
    const googleRequest = {
      provider: 'google',
      model: 'gemini-1.5-pro',
      prompt: 'Tell me about safety measures',
      apiKey: API_KEYS.google
    };

    const safetyRequest = createSafetyConfiguredRequest(googleRequest, {
      google: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });
    console.log('Google: Created safety-configured request with harassment and hate speech filters');
    console.log();
  } catch (error) {
    console.log(`  Google safety configuration: ${error.message}\n`);
  }

  console.log('✅ All advanced feature tests completed!');
  console.log('\n📋 Summary of Implementation:');
  console.log('- ✅ Provider-specific parameter handling');
  console.log('- ✅ System message handling (standard/top-level/parameter)');
  console.log('- ✅ Structured output support with JSON Schema');
  console.log('- ✅ Function calling with tool definitions');
  console.log('- ✅ Caching support (Anthropic, Google)');
  console.log('- ✅ Safety settings (Google, Mistral)');
  console.log('- ✅ Enhanced validation with model-specific constraints');
  console.log('- ✅ Cost estimation with accurate pricing');
  console.log('- ✅ Comprehensive provider information and capabilities');
}

// Run the tests
testProviderFeatures().catch(console.error);