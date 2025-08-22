# Dynamic LLM Provider Switching

This document describes the dynamic LLM provider switching functionality implemented in SFL Prompt Studio.

## Overview

The application now supports dynamic switching between different AI providers (OpenAI, Anthropic, Google Gemini, OpenRouter) at request-level without requiring application restarts or configuration changes.

## Architecture

### Key Components

1. **AIProviderFactory** - Singleton factory that creates and caches AI service instances
2. **BaseAIService** - Abstract base class defining the common interface for all AI providers
3. **UnifiedAIService** - Service layer that maintains backward compatibility while supporting multiple providers
4. **Provider-specific services** - Implementations for each supported AI provider

### Flow Diagram

```
Frontend Request → GeminiController → UnifiedAIService → AIProviderFactory → Provider Service → AI API
```

## API Changes

### Backward Compatibility

All existing `/api/gemini/*` endpoints continue to work without any changes. If no provider is specified, the system defaults to Google Gemini.

### New Request Format

All endpoints now accept optional provider configuration in the request body:

```json
{
  "promptText": "Your prompt here",
  "provider": "openai",           // Optional: "google", "openai", "anthropic", "openrouter"
  "model": "gpt-4",              // Optional: provider-specific model
  "parameters": {                 // Optional: provider-specific parameters
    "temperature": 0.7,
    "maxTokens": 1000,
    "top_p": 1.0
  },
  "apiKey": "your-api-key",      // Optional: runtime API key
  "baseUrl": "custom-base-url"    // Optional: custom base URL
}
```

## Supported Providers

### Google Gemini

- **Provider ID**: `google`
- **Default Model**: `gemini-2.5-flash`
- **Supported Parameters**: `temperature`, `maxTokens`, `topK`, `topP`, `systemInstruction`, `safetySettings`

### OpenAI

- **Provider ID**: `openai`
- **Default Model**: `gpt-4`
- **Supported Parameters**: `temperature`, `maxTokens`, `top_p`, `presence_penalty`, `frequency_penalty`, `systemMessage`, `n`, `stop`

### Anthropic Claude

- **Provider ID**: `anthropic`
- **Default Model**: `claude-3-5-sonnet-20241022`
- **Supported Parameters**: `temperature`, `maxTokens`, `top_p`, `top_k`, `system`, `stop_sequences`

### OpenRouter (Planned)

- **Provider ID**: `openrouter`
- **Status**: Not yet implemented

## Usage Examples

### Legacy Usage (Still Supported)

```javascript
// This continues to work as before
fetch('/api/gemini/test-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promptText: 'Hello world'
  })
});
```

### Dynamic Provider Switching

```javascript
// Use OpenAI instead of Gemini
fetch('/api/gemini/test-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promptText: 'Hello world',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    parameters: {
      temperature: 0.8,
      maxTokens: 150
    }
  })
});
```

### SFL Generation with Different Providers

```javascript
// Generate SFL prompt using Anthropic Claude
fetch('/api/gemini/generate-sfl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    goal: 'Write a professional email',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    parameters: {
      temperature: 0.7,
      maxTokens: 2000
    }
  })
});
```

## Configuration

### Environment Variables

The system supports API keys from environment variables:

```bash
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Runtime API Keys

API keys can also be provided at runtime in the request body, which takes precedence over environment variables:

```json
{
  "promptText": "Hello",
  "provider": "openai",
  "apiKey": "runtime-api-key-here"
}
```

## Service Caching

The AIProviderFactory implements intelligent service caching to improve performance:

- Services are cached based on provider, API key hash, and base URL
- LRU eviction policy with a maximum cache size of 10
- Cache can be cleared programmatically for testing or configuration changes

## Error Handling

The system provides consistent error handling across all providers:

- Authentication errors (401)
- Rate limiting (429)
- Invalid parameters (400)
- Server errors (500)
- Network errors

All errors are normalized to a consistent format regardless of the underlying provider.

## Testing

### Automated Tests

Use the provided test scripts:

```bash
# Node.js test script
node test-provider-switching.js

# Curl test script
./test-curl.sh
```

### Manual Testing

1. Start the backend server
2. Send requests to `/api/gemini/*` endpoints
3. Include provider configuration in request body
4. Verify responses come from the specified provider

## Migration Guide

### For Frontend Developers

1. **No immediate changes required** - existing code continues to work
2. **To use new providers** - add provider configuration to request bodies
3. **Provider selection UI** - can be added to allow users to choose providers

### For Backend Developers

1. **New providers** - implement `BaseAIService` and add to `AIProviderFactory`
2. **Custom parameters** - extend the parameter types in `aiProvider.ts`
3. **Testing** - use the provided test scripts to verify functionality

## Security Considerations

1. **API Key Handling** - Keys are cached using partial hashes for security
2. **Request Validation** - All parameters are validated before API calls
3. **Error Sanitization** - Sensitive information is not exposed in error messages
4. **Rate Limiting** - Inherit provider-specific rate limits

## Performance Optimizations

1. **Service Caching** - Reuse configured service instances
2. **Lazy Loading** - Services are only created when needed
3. **Connection Pooling** - HTTP client reuse within services
4. **Request Deduplication** - Cache prevents duplicate service creation

## Future Enhancements

1. **OpenRouter Support** - Complete the OpenRouter service implementation
2. **Streaming Support** - Implement streaming completions for all providers
3. **Function Calling** - Add support for function/tool calling where available
4. **Model Management** - Dynamic model discovery and validation
5. **Usage Analytics** - Track usage across different providers
6. **Cost Optimization** - Intelligent provider selection based on cost/performance

## Troubleshooting

### Common Issues

1. **"Provider not supported"** - Check that the provider ID is correct
2. **Authentication errors** - Verify API keys are correct and have proper permissions
3. **Parameter validation errors** - Check that parameters match provider requirements
4. **Service creation failures** - Verify environment variables and network connectivity

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed request/response information.

### Health Checks

Use the provider health check endpoint:

```bash
curl http://localhost:5001/api/providers/health
```
