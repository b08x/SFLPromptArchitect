# Advanced Provider-Specific Features Documentation

## Overview

This document describes the advanced provider-specific configurations and features implemented in the SFL Prompt Studio backend. The system now supports comprehensive provider-specific functionality for all 8 AI providers using the Vercel AI SDK.

## Supported Providers

- **OpenAI** - GPT models with structured output and function calling
- **Anthropic** - Claude models with cache control and top-level system messages  
- **Google (Gemini)** - Multimodal models with safety settings and vision capabilities
- **OpenRouter** - Unified access to multiple models with routing and fallback
- **Ollama** - Local model deployment with custom configurations
- **Cohere** - RAG-optimized models with citation capabilities
- **Mistral** - European models with structured output and reasoning
- **Groq** - Ultra-fast inference with LPU acceleration

## Key Implementation Details

### 1. Provider-Specific System Message Handling

Different providers handle system messages in different ways:

```typescript
// Standard handling (OpenAI, OpenRouter, Ollama, Mistral, Groq)
messages: [
  { role: 'system', content: systemMessage },
  { role: 'user', content: userPrompt }
]

// Top-level parameter (Anthropic)
{
  model: 'claude-3-5-sonnet-20241022',
  system: systemMessage,
  messages: [{ role: 'user', content: userPrompt }]
}

// Provider options parameter (Google, Cohere)
{
  model: 'gemini-1.5-pro',
  systemInstruction: systemMessage, // Google
  preamble: systemMessage,         // Cohere
  messages: [{ role: 'user', content: userPrompt }]
}
```

### 2. Advanced Features Support

#### Structured Output (JSON Schema)

Supported providers: OpenAI, Groq, Mistral, Anthropic

```typescript
const structuredRequest = createStructuredOutputRequest(baseRequest, {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    skills: { type: 'array', items: { type: 'string' } }
  },
  required: ['name', 'age']
});
```

#### Function Calling

Supported providers: OpenAI, Anthropic, Google, Groq, Mistral, Cohere, OpenRouter

```typescript
const functionRequest = createFunctionCallingRequest(baseRequest, [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City and state' }
      },
      required: ['location']
    }
  }
], 'auto');
```

#### Caching

Supported providers: Anthropic, Google

```typescript
// Anthropic ephemeral caching
const cachedRequest = createCachedRequest(baseRequest, {
  anthropic: { type: 'ephemeral', beta: true }
});

// Google cached content
const cachedRequest = createCachedRequest(baseRequest, {
  google: { cachedContent: 'cached-content-id' }
});
```

#### Safety Settings

Supported providers: Google, Mistral

```typescript
const safetyRequest = createSafetyConfiguredRequest(baseRequest, {
  google: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
  mistral: {
    safePrompt: true
  }
});
```

### 3. Provider-Specific Options

Each provider supports unique configuration options:

#### OpenAI
```typescript
providerOptions: {
  openai: {
    user: 'user-id',
    logitBias: { '1234': -100 },
    responseFormat: { type: 'json_schema' },
    toolChoice: 'auto',
    parallelToolCalls: true
  }
}
```

#### Anthropic
```typescript
providerOptions: {
  anthropic: {
    cacheControl: { type: 'ephemeral', beta: true },
    beta: ['cache-control']
  }
}
```

#### Google
```typescript
providerOptions: {
  google: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ],
    generationConfig: {
      candidateCount: 1,
      maxOutputTokens: 8192,
      topK: 40,
      topP: 0.95
    }
  }
}
```

#### Groq
```typescript
providerOptions: {
  groq: {
    reasoningEffort: 'medium',
    parallelToolCalls: true,
    responseFormat: { type: 'json_schema' }
  }
}
```

#### Mistral
```typescript
providerOptions: {
  mistral: {
    safePrompt: true,
    responseFormat: { type: 'json_object' }
  }
}
```

#### Cohere
```typescript
providerOptions: {
  cohere: {
    inputType: 'search_query',
    truncate: 'END',
    citationQuality: 'accurate',
    searchQueriesOnly: false
  }
}
```

#### OpenRouter
```typescript
providerOptions: {
  openrouter: {
    provider: {
      order: ['openai', 'anthropic'],
      allowFallbacks: true
    },
    route: 'fallback'
  }
}
```

#### Ollama
```typescript
providerOptions: {
  ollama: {
    keepAlive: '5m',
    numCtx: 4096,
    numPredict: 128,
    temperature: 0.7
  }
}
```

## Configuration Management

### Model Configuration

All models and their capabilities are centrally configured in `/src/config/model-config.ts`:

```typescript
export const MODEL_CONFIG: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [/* model definitions */],
    parameterMappings: { 'top_p': 'topP' },
    supportedFeatures: ['streaming', 'function_calling'],
    specialHandling: {
      systemMessageHandling: 'standard',
      authenticationMethod: 'bearer'
    }
  }
  // ... other providers
};
```

### Parameter Validation

Enhanced validation with model-specific constraints:

```typescript
const validation = validateParameters('openai', parameters, 'gpt-4o');
// Returns: { valid: boolean, errors: string[], warnings: string[] }
```

### Cost Estimation

Accurate cost calculation based on current pricing:

```typescript
const cost = getEstimatedCost(request, inputTokens, outputTokens);
// Returns: { inputCost, outputCost, totalCost, currency }
```

## API Usage Examples

### Basic Completion with Provider-Specific Features

```typescript
const request: CompletionRequest = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  prompt: 'Analyze this document',
  systemMessage: 'You are a helpful analyst',
  parameters: { temperature: 0.7, maxTokens: 2000 },
  apiKey: process.env.ANTHROPIC_API_KEY,
  providerOptions: {
    anthropic: {
      cacheControl: { type: 'ephemeral', beta: true }
    }
  }
};

const response = await generateCompletion(request);
```

### Streaming with Advanced Features

```typescript
const response = await streamCompletion(request, (chunk) => {
  console.log(chunk); // Process each chunk
});
```

### Provider Information and Capabilities

```typescript
// Get comprehensive provider info
const info = getProviderInfo('google');

// Check specific model capabilities
const capabilities = getProviderCapabilities('openai', 'gpt-4o');

// Validate parameters
const validation = validateParameters('mistral', parameters, 'mistral-large-latest');
```

## Migration from Legacy Implementation

The new implementation maintains backward compatibility while adding advanced features:

1. **Existing API calls continue to work** - All existing parameters and basic functionality remain unchanged
2. **Enhanced responses** - Response objects now include additional metadata about capabilities and provider configs
3. **New optional features** - Advanced features are opt-in via the `providerOptions` parameter
4. **Improved error handling** - Provider-specific error messages and validation

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const response = await generateCompletion(request);
} catch (error) {
  if (error instanceof AIServiceError) {
    console.log(`Provider: ${error.provider}`);
    console.log(`Message: ${error.message}`);
    console.log(`Original error:`, error.originalError);
  }
}
```

## Testing

Use the provided test script to validate functionality:

```bash
node testing/test-provider-advanced-features.js
```

This tests all advanced features including:
- Provider information retrieval
- Model capability checking
- Parameter validation
- Cost estimation
- Structured output creation
- Function calling setup
- Caching configuration
- Safety settings

## Performance Considerations

1. **Configuration caching** - Provider configurations are cached for optimal performance
2. **Streaming support** - All capable models support streaming for better user experience
3. **Efficient parameter mapping** - Provider-specific parameters are mapped efficiently
4. **Model validation** - Early validation prevents unnecessary API calls

## Security Features

1. **API key validation** - Proper API key requirements enforced per provider
2. **Parameter sanitization** - All parameters validated before API calls
3. **Safety settings** - Content filtering available for supported providers
4. **Secure defaults** - Conservative default settings for all providers

## Future Enhancements

Planned improvements include:
- Vision input support for multimodal models
- Fine-tuning capabilities for supported providers
- Advanced retrieval-augmented generation (RAG) features
- Custom model deployment support
- Enhanced monitoring and analytics