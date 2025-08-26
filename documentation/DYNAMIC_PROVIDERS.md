# Dynamic LLM Provider Switching with Vercel AI SDK

## Overview

The application now supports dynamic switching between multiple AI providers using the Vercel AI SDK. This implementation provides enhanced flexibility, advanced features, and expanded provider support.

## Key Changes from Previous Implementation

1. **Provider Support Expanded**
   - Increased from 4 to 8 providers
   - Standardized integration using Vercel AI SDK
   - Advanced features like streaming and function calling

2. **New Supported Providers**
   - OpenAI
   - Anthropic
   - Google (Gemini)
   - OpenRouter
   - Ollama
   - Cohere
   - Mistral
   - Groq

## Architectural Improvements

### New Components
1. **Vercel AI SDK Integration**
2. **Provider-agnostic Service Layer**
3. **Unified Configuration Management**
4. **Advanced Feature Support**

### Flow Diagram
```
Frontend Request → 
UnifiedAIService → 
Vercel AI SDK → 
Selected Provider Service → 
AI API
```

## Request Format

```json
{
  "promptText": "Your prompt here",
  "provider": "openai",           // Required
  "model": "gpt-4o",              // Required
  "parameters": {                 // Optional
    "temperature": 0.7,
    "maxTokens": 1000
  },
  "providerOptions": {            // Advanced configuration
    "openai": {
      "responseFormat": "json_object",
      "toolChoice": "auto"
    }
  }
}
```

## Supported Providers and Capabilities

### OpenAI
- **Default Model**: `gpt-4o`
- **Features**: 
  - Streaming
  - Function Calling
  - Structured Outputs
  - JSON Mode

### Anthropic
- **Default Model**: `claude-3-5-sonnet-20241022`
- **Features**:
  - Top-level System Messages
  - Advanced Caching
  - Structured Outputs

### Google (Gemini)
- **Default Model**: `gemini-1.5-pro`
- **Features**:
  - Multimodal Support
  - Safety Settings
  - Vision Input

### Additional Providers
- **OpenRouter**: Multi-model routing
- **Ollama**: Local model deployment
- **Cohere**: RAG-optimized models
- **Mistral**: European AI models
- **Groq**: Ultra-fast inference

## Advanced Features

### 1. Streaming Support
```typescript
const stream = await generateText({
  model: openai('gpt-4o'),
  stream: true,
  onChunk: (chunk) => {
    // Process streaming tokens
  }
});
```

### 2. Function Calling
```typescript
const result = await generateToolResponse({
  model: openai('gpt-4o'),
  tools: [{
    name: 'get_weather',
    parameters: { location: 'string' }
  }]
});
```

### 3. Structured Outputs
```typescript
const response = await generateObject({
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

## Configuration and Environment

### API Key Management
```bash
# Environment Variables
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
# ... other provider keys
```

## Security Considerations

1. Server-side API key management
2. Input parameter validation
3. Provider-specific safety settings
4. Rate limiting
5. Error normalization

## Performance Optimizations

1. Provider service caching
2. Intelligent provider routing
3. Minimal overhead in provider switching
4. Efficient token usage tracking

## Future Enhancements

1. Enhanced multimodal support
2. Fine-tuning capabilities
3. Advanced RAG features
4. Expanded provider ecosystem
5. Cost-based provider selection

## Troubleshooting

1. Verify API keys and configurations
2. Check provider-specific documentation
3. Review error logs
4. Use comprehensive test suites

---

🤖 Generated with Claude Code AI Toolkit
Last Updated: 2024-08-26