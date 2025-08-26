# Vercel AI SDK Migration Guide

## Overview

This document provides a comprehensive migration guide for transitioning from our custom AI provider implementation to the Vercel AI SDK.

## Background

### Previous Implementation
- Custom-built AI provider management
- Limited provider support
- Manual configuration for each provider
- Complex maintenance of provider-specific logic

### New Implementation
- Standardized Vercel AI SDK integration
- Expanded provider support
- Advanced features like streaming and function calling
- Simplified configuration
- Enhanced performance and reliability

## Supported Providers

1. OpenAI
2. Anthropic
3. Google (Gemini)
4. OpenRouter
5. Ollama
6. Cohere
7. Mistral
8. Groq

## Migration Steps

### 1. Install Dependencies
```bash
npm install @vercel/ai
npm install openai anthropic @google/generative-ai cohere-ai mistralai groq-sdk ollama-ai openrouter-ai
```

### 2. Update Configuration
Replace previous provider configuration with Vercel AI SDK compatible setup:

```typescript
const MODEL_CONFIG = {
  openai: {
    name: 'OpenAI',
    models: [
      { 
        id: 'gpt-4o', 
        capabilities: ['streaming', 'function_calling'] 
      }
    ],
    supportedFeatures: [
      'streaming', 
      'function_calling', 
      'structured_output'
    ]
  }
  // Add other providers
};
```

### 3. Service Layer Modifications
Update AI service to use Vercel AI SDK:

```typescript
import { generateText, generateObject, generateToolResponse } from 'ai';
import { openai, anthropic } from 'ai/providers';

async function generateCompletion(request) {
  const { provider, model, prompt, parameters } = request;

  const providerMap = {
    openai: openai(apiKey),
    anthropic: anthropic(apiKey)
  };

  const selectedProvider = providerMap[provider];

  return generateText({
    model: selectedProvider.chat(model),
    prompt,
    ...parameters
  });
}
```

### 4. Streaming Implementation
```typescript
async function streamCompletion(request, onChunk) {
  return generateText({
    model: selectedProvider.chat(model),
    stream: true,
    onChunk
  });
}
```

### 5. Frontend React Components
```typescript
import { useCompletion } from 'ai/react';

function PromptComponent() {
  const { completion, handleSubmit } = useCompletion({
    api: '/api/generate',
    body: {
      provider: 'openai',
      model: 'gpt-4o'
    }
  });
}
```

## Advanced Features

### Structured Outputs
```typescript
const structuredResponse = await generateObject({
  model: openai('gpt-4o'),
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  }
});
```

### Function Calling
```typescript
const functionResponse = await generateToolResponse({
  model: openai('gpt-4o'),
  tools: [{
    name: 'get_weather',
    parameters: { location: 'string' }
  }]
});
```

## Error Handling
```typescript
try {
  const result = await generateCompletion(request);
} catch (error) {
  if (error instanceof AIServiceError) {
    // Provider-specific error handling
  }
}
```

## Performance Considerations
- Intelligent caching
- Streaming support
- Provider fallback strategies

## Security Best Practices
- Server-side API key management
- Input validation
- Secure error handling

## Testing
```bash
npm run test:providers
npm run test:streaming
```

## Rollback Strategy
1. Keep previous implementation as fallback
2. Gradual provider migration
3. Comprehensive test coverage

## Future Enhancements
- Vision input support
- Fine-tuning capabilities
- Advanced RAG features

## Troubleshooting
1. Verify API keys
2. Check network connectivity
3. Review provider documentation
4. Use debug logging

---

🤖 Generated with Claude Code AI Toolkit
Last Updated: 2024-08-26