/**
 * @file aiService.ts
 * @description Multi-provider AI service for API key validation and model listing.
 * Supports Google Gemini, OpenAI, and OpenAI-compatible providers like OpenRouter.
 * Uses direct HTTP calls to avoid dependency issues.
 */

/**
 * Supported AI providers for the multi-provider service
 */
export type AIProvider = 'google' | 'openai' | 'openrouter';

/**
 * Configuration options for AI providers
 */
export interface AIProviderOptions {
  baseURL?: string;
}

/**
 * Result of API key validation
 */
export interface APIKeyValidationResult {
  success: boolean;
}

/**
 * Validates an API key by making a simple request to the provider's API
 * @param provider - The AI provider to validate against
 * @param apiKey - The API key to validate
 * @param options - Optional configuration (e.g., custom baseURL)
 * @returns Promise resolving to validation result
 * @throws Error with descriptive message if validation fails
 */
export async function validateApiKey(
  provider: AIProvider,
  apiKey: string,
  options?: AIProviderOptions
): Promise<APIKeyValidationResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  try {
    switch (provider) {
      case 'google': {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid Google API key. Please check your key and try again.');
          } else if (response.status === 403) {
            throw new Error('Google API key does not have permission to access Generative AI models.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded for Google API. Please try again later.');
          } else {
            throw new Error(`Google API error: ${response.status} ${response.statusText}`);
          }
        }

        return { success: true };
      }

      case 'openai': {
        const baseURL = options?.baseURL || 'https://api.openai.com';
        const response = await fetch(`${baseURL}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your key and try again.');
          } else if (response.status === 403) {
            throw new Error('OpenAI API key does not have permission to access models.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded for OpenAI API. Please try again later.');
          } else {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }
        }

        return { success: true };
      }

      case 'openrouter': {
        const baseURL = options?.baseURL || 'https://openrouter.ai';
        const response = await fetch(`${baseURL}/api/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SFL Prompt Studio',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid OpenRouter API key. Please check your key and try again.');
          } else if (response.status === 403) {
            throw new Error('OpenRouter API key does not have permission to access models.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded for OpenRouter API. Please try again later.');
          } else {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
          }
        }

        return { success: true };
      }

      default: {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Network error validating ${provider} API key: ${String(error)}`);
    }
  }
}

/**
 * Lists available models for a given provider
 * @param provider - The AI provider
 * @param apiKey - The API key for the provider
 * @param options - Optional configuration (e.g., custom baseURL)
 * @returns Promise resolving to array of model IDs
 * @throws Error if the request fails
 */
export async function listModels(
  provider: AIProvider,
  apiKey: string,
  options?: AIProviderOptions
): Promise<string[]> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  try {
    switch (provider) {
      case 'google': {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid Google API key. Please check your key and try again.');
          } else if (response.status === 403) {
            throw new Error('Google API key does not have permission to access Generative AI models.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded for Google API. Please try again later.');
          } else {
            throw new Error(`Google API error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        const models = data.models
          ?.filter((model: any) => 
            model.supportedGenerationMethods?.includes('generateContent') && 
            model.name?.includes('gemini')
          )
          .map((model: any) => model.name?.replace('models/', '') || model.name)
          .sort() || [];

        return models;
      }

      case 'openai': {
        const baseURL = options?.baseURL || 'https://api.openai.com';
        const response = await fetch(`${baseURL}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your key and try again.');
          } else if (response.status === 403) {
            throw new Error('OpenAI API key does not have permission to access models.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded for OpenAI API. Please try again later.');
          } else {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        const models = data.data
          ?.filter((model: any) => 
            (model.id?.startsWith('gpt-') || model.id?.startsWith('o1-')) &&
            !model.id?.includes('embedding') &&
            !model.id?.includes('whisper') &&
            !model.id?.includes('tts') &&
            !model.id?.includes('dall-e')
          )
          .map((model: any) => model.id)
          .sort() || [];

        return models;
      }

      case 'openrouter': {
        const baseURL = options?.baseURL || 'https://openrouter.ai';
        const response = await fetch(`${baseURL}/api/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SFL Prompt Studio',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid OpenRouter API key. Please check your key and try again.');
          } else if (response.status === 403) {
            throw new Error('OpenRouter API key does not have permission to access models.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded for OpenRouter API. Please try again later.');
          } else {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        const models = data.data
          ?.map((model: any) => model.id)
          .sort() || [];

        return models;
      }

      default: {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Network error fetching models for ${provider}: ${String(error)}`);
    }
  }
}