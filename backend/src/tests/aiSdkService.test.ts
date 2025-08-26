import {
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
} from '../services/ai/aiSdkService';

// Mock environment variables or use a test configuration
const API_KEYS = {
  openai: process.env.TEST_OPENAI_API_KEY || 'test-key',
  anthropic: process.env.TEST_ANTHROPIC_API_KEY || 'test-key',
  google: process.env.TEST_GOOGLE_API_KEY || 'test-key',
  openrouter: process.env.TEST_OPENROUTER_API_KEY || 'test-key',
  ollama: 'local',
  cohere: process.env.TEST_COHERE_API_KEY || 'test-key',
  mistral: process.env.TEST_MISTRAL_API_KEY || 'test-key',
  groq: process.env.TEST_GROQ_API_KEY || 'test-key'
};

describe('AI SDK Service - Provider Integration', () => {
  // Supported Providers Test
  test('should return all supported providers', () => {
    const providers = getSupportedProviders();
    const expectedProviders = [
      'openai', 'anthropic', 'google', 'openrouter', 
      'ollama', 'cohere', 'mistral', 'groq'
    ];
    expectedProviders.forEach(provider => {
      expect(providers).toContain(provider);
    });
    expect(providers.length).toBe(8);
  });

  // Provider Information Tests
  describe('Provider Information', () => {
    const providerTests = [
      { 
        provider: 'openai', 
        expectedFeatures: ['streaming', 'function_calling', 'structured_output']
      },
      { 
        provider: 'anthropic', 
        expectedFeatures: ['system_messages', 'long_context']
      },
      { 
        provider: 'google', 
        expectedFeatures: ['safety_settings', 'multimodal']
      }
    ];

    providerTests.forEach(({ provider, expectedFeatures }) => {
      test(`should provide correct information for ${provider}`, () => {
        const info = getProviderInfo(provider);
        
        expect(info).toBeDefined();
        expect(info.baseUrl).toBeTruthy();
        expect(info.requiresApiKey).toBeDefined();
        expect(info.models.length).toBeGreaterThan(0);
        
        expectedFeatures.forEach(feature => {
          expect(info.supportedFeatures).toContain(feature);
        });
      });
    });
  });

  // Model Capabilities Tests
  describe('Model Capabilities', () => {
    const modelTests = [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'google', model: 'gemini-1.5-pro' }
    ];

    modelTests.forEach(({ provider, model }) => {
      test(`should retrieve capabilities for ${provider}/${model}`, () => {
        const capabilities = getProviderCapabilities(provider, model);
        
        expect(capabilities).toBeDefined();
        expect(capabilities.streaming).toBeDefined();
        expect(capabilities.functionCalling).toBeDefined();
        expect(capabilities.structuredOutput).toBeDefined();
        expect(capabilities.maxOutputTokens).toBeGreaterThan(0);
      });
    });
  });

  // Parameter Validation Tests
  describe('Parameter Validation', () => {
    const validationTests = [
      {
        provider: 'openai',
        model: 'gpt-4o',
        parameters: { temperature: 0.7, maxTokens: 1000, top_p: 0.9 },
        expectedValidity: true
      },
      {
        provider: 'anthropic', 
        model: 'claude-3-5-sonnet-20241022',
        parameters: { temperature: 0.5, maxTokens: 2000, top_k: 40 },
        expectedValidity: true
      }
    ];

    validationTests.forEach(({ provider, model, parameters, expectedValidity }) => {
      test(`should validate parameters for ${provider}/${model}`, () => {
        const validation = validateParameters(provider, parameters, model);
        
        expect(validation.valid).toBe(expectedValidity);
        
        if (!expectedValidity) {
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      });
    });
  });

  // Cost Estimation Tests
  describe('Cost Estimation', () => {
    const costTests = [
      { 
        provider: 'openai', 
        model: 'gpt-4o', 
        inputTokens: 1000, 
        outputTokens: 500 
      },
      { 
        provider: 'anthropic', 
        model: 'claude-3-5-haiku-20241022', 
        inputTokens: 1000, 
        outputTokens: 500 
      }
    ];

    costTests.forEach(({ provider, model, inputTokens, outputTokens }) => {
      test(`should estimate cost for ${provider}/${model}`, () => {
        const request = {
          provider,
          model,
          prompt: 'Test cost estimation',
          apiKey: API_KEYS[provider]
        };
        
        const cost = getEstimatedCost(request, inputTokens, outputTokens);
        
        expect(cost.inputCost).toBeGreaterThanOrEqual(0);
        expect(cost.outputCost).toBeGreaterThanOrEqual(0);
        expect(cost.totalCost).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // Structured Output Tests
  describe('Structured Output Requests', () => {
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

    structuredOutputProviders.forEach(provider => {
      test(`should create structured output request for ${provider}`, () => {
        const baseRequest = {
          provider,
          model: provider === 'openai' ? 'gpt-4o' : 
                 provider === 'groq' ? 'llama-3.1-70b-versatile' : 'mistral-large-latest',
          prompt: 'Generate a person profile',
          apiKey: API_KEYS[provider]
        };

        const structuredRequest = createStructuredOutputRequest(baseRequest, jsonSchema);
        
        expect(structuredRequest).toBeDefined();
        expect(structuredRequest.providerOptions).toBeDefined();
      });
    });
  });

  // Function Calling Tests
  describe('Function Calling Requests', () => {
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

    functionCallingProviders.forEach(provider => {
      test(`should create function calling request for ${provider}`, () => {
        const baseRequest = {
          provider,
          model: provider === 'openai' ? 'gpt-4o' : 
                 provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'llama-3.1-70b-versatile',
          prompt: 'What is the weather like in San Francisco?',
          apiKey: API_KEYS[provider]
        };

        const functionRequest = createFunctionCallingRequest(baseRequest, tools, 'auto');
        
        expect(functionRequest).toBeDefined();
        expect(functionRequest.tools).toBeDefined();
        expect(functionRequest.tools.length).toBe(1);
      });
    });
  });

  // Cached Request Tests
  describe('Cached Requests', () => {
    test('should create cached request for Anthropic', () => {
      const anthropicRequest = {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        prompt: 'Analyze this document',
        apiKey: API_KEYS.anthropic
      };

      const cachedRequest = createCachedRequest(anthropicRequest, {
        anthropic: { type: 'ephemeral', beta: true }
      });

      expect(cachedRequest).toBeDefined();
      expect(cachedRequest.cacheOptions).toBeDefined();
    });
  });

  // Safety Configuration Tests
  describe('Safety Configured Requests', () => {
    test('should create safety-configured request for Google', () => {
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

      expect(safetyRequest).toBeDefined();
      expect(safetyRequest.safetySettings).toBeDefined();
    });
  });
});