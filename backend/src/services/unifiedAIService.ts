/**
 * @file unifiedAIService.ts
 * @description Unified AI service that provides dynamic provider switching while maintaining
 * compatibility with existing SFL prompt generation and workflow creation functionality.
 * Acts as a bridge between the legacy GeminiService interface and the new multi-provider architecture.
 */

import { generateCompletion, CompletionRequest, AIResponse, AIServiceError } from './ai/aiSdkService';
import { AIProvider, AIRequest, ModelParameters } from '../types/aiProvider';
import { PromptSFL, Workflow } from '../types';

/**
 * Request configuration for provider-aware AI operations
 * Note: apiKey should come from session storage, not directly from client
 */
export interface ProviderAwareRequest {
  provider?: AIProvider;
  model?: string;
  parameters?: ModelParameters;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Session-aware request configuration
 */
export interface SessionAwareRequest extends Omit<ProviderAwareRequest, 'apiKey'> {
  sessionApiKeys?: {
    [provider: string]: {
      encrypted: string;
      iv: string;
      timestamp: number;
    };
  };
  sessionBaseUrls?: {
    [provider: string]: string;
  };
}

/**
 * Configuration for default provider fallback
 */
interface DefaultProviderConfig {
  provider: AIProvider;
  model: string;
  parameters: ModelParameters;
}

/**
 * Unified AI service that supports multiple providers while maintaining backward compatibility
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService;
  private defaultProvider: DefaultProviderConfig;

  private constructor() {
    // Set default provider configuration (fallback to Gemini for backward compatibility)
    this.defaultProvider = {
      provider: 'google',
      model: 'gemini-2.5-flash',
      parameters: {
        temperature: 0.7,
        maxTokens: 4096
      }
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  /**
   * Test a prompt with specified or default provider
   * Now uses aiSdkService for all providers including Google
   */
  async testPrompt(
    promptText: string, 
    providerConfig?: ProviderAwareRequest | SessionAwareRequest,
    req?: import('express').Request
  ): Promise<string> {
    try {
      // Get preferred provider if not specified
      const provider = providerConfig?.provider || (req ? await (await import('./providerValidationService')).getPreferredProvider(req) : null) || 'google';
      
      // Use new aiSdkService for all providers
      const apiKey = await this.getApiKey({
        ...providerConfig,
        provider
      });
      
      const request: CompletionRequest = {
        provider,
        model: providerConfig?.model || this.getDefaultModelForProvider(provider),
        parameters: providerConfig?.parameters || this.getDefaultParametersForProvider(provider),
        prompt: promptText,
        apiKey,
        baseUrl: providerConfig?.baseUrl
      };

      const response = await generateCompletion(request);
      return response.text;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate SFL prompt from goal with specified or default provider
   * Now uses aiSdkService for all providers
   */
  async generateSFLFromGoal(
    goal: string,
    sourceDocContent?: string,
    providerConfig?: ProviderAwareRequest,
    req?: import('express').Request
  ): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> {
    try {
      // Get preferred provider if not specified
      const provider = providerConfig?.provider || (req ? await (await import('./providerValidationService')).getPreferredProvider(req) : null) || 'google';
      
      // Use aiSdkService for all providers
      const apiKey = await this.getApiKey({
        ...providerConfig,
        provider
      });
      const systemInstruction = this.getSFLSystemInstruction();
      
      const userContent = sourceDocContent
        ? `Source document for style reference:\n\n---\n\n${sourceDocContent}\n\n----\n\nUser's goal: "${goal}"`
        : `Here is the user's goal: "${goal}"`;

      const request: CompletionRequest = {
        provider,
        model: providerConfig?.model || this.getDefaultModelForProvider(provider),
        parameters: providerConfig?.parameters || this.getDefaultParametersForProvider(provider),
        prompt: userContent,
        systemMessage: systemInstruction,
        apiKey,
        baseUrl: providerConfig?.baseUrl
      };

      const response = await generateCompletion(request);
      const jsonData = this.parseJsonFromText(response.text);
      
      // Ensure targetAudience is an array
      if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
        jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
      }
      if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
        jsonData.sflTenor.targetAudience = [];
      }

      return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Regenerate SFL prompt from suggestion with specified or default provider
   * Now uses aiSdkService for all providers
   */
  async regenerateSFLFromSuggestion(
    currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>,
    suggestion: string,
    providerConfig?: ProviderAwareRequest,
    req?: import('express').Request
  ): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> {
    try {
      // Get preferred provider if not specified
      const provider = providerConfig?.provider || (req ? await (await import('./providerValidationService')).getPreferredProvider(req) : null) || 'google';
      
      // Use aiSdkService for all providers
      const apiKey = await this.getApiKey({
        ...providerConfig,
        provider
      });
      const systemInstruction = this.getSFLRegenerationSystemInstruction();
      
      const { sourceDocument, ...promptForPayload } = currentPrompt;
      const userContent = `
      Here is the current prompt JSON:
      ${JSON.stringify(promptForPayload)}
      
      ${sourceDocument ? `This prompt is associated with the following source document for stylistic reference:
---
${sourceDocument.content}
---
` : ''}

      Here is my suggestion for how to change it:
      "${suggestion}"

      Now, provide the complete, revised JSON object.
      `;

      const request: CompletionRequest = {
        provider,
        model: providerConfig?.model || this.getDefaultModelForProvider(provider),
        parameters: providerConfig?.parameters || this.getDefaultParametersForProvider(provider),
        prompt: userContent,
        systemMessage: systemInstruction,
        apiKey,
        baseUrl: providerConfig?.baseUrl
      };

      const response = await generateCompletion(request);
      const jsonData = this.parseJsonFromText(response.text);
      
      // Ensure targetAudience is an array
      if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
        jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
      }
      if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
        jsonData.sflTenor.targetAudience = [];
      }
      
      // Preserve the source document from the original prompt
      jsonData.sourceDocument = sourceDocument;

      return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate workflow from goal with specified or default provider
   * Now uses aiSdkService for all providers
   */
  async generateWorkflowFromGoal(
    goal: string,
    providerConfig?: ProviderAwareRequest,
    req?: import('express').Request
  ): Promise<Workflow> {
    try {
      // Get preferred provider if not specified
      const provider = providerConfig?.provider || (req ? await (await import('./providerValidationService')).getPreferredProvider(req) : null) || 'google';
      
      // Use aiSdkService for all providers
      const apiKey = await this.getApiKey({
        ...providerConfig,
        provider
      });
      const systemInstruction = this.getWorkflowSystemInstruction();

      const request: CompletionRequest = {
        provider,
        model: providerConfig?.model || this.getDefaultModelForProvider(provider),
        parameters: providerConfig?.parameters || this.getDefaultParametersForProvider(provider),
        prompt: `User's goal: "${goal}"`,
        systemMessage: systemInstruction,
        apiKey,
        baseUrl: providerConfig?.baseUrl
      };

      const response = await generateCompletion(request);
      const jsonData = this.parseJsonFromText(response.text);
      
      if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
        throw new Error("Generated workflow is missing required fields (name, description, tasks).");
      }
      
      jsonData.id = `wf-custom-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      return jsonData as Workflow;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get API key for the specified provider from various sources
   * Now supports session-aware API key retrieval and secure configuration
   */
  private async getApiKey(config: ProviderAwareRequest | SessionAwareRequest): Promise<string> {
    if (!config.provider) {
      throw new Error('Provider is required');
    }

    let apiKey: string | undefined;
    
    // Type narrow to access apiKey property safely
    if ('apiKey' in config) {
      apiKey = config.apiKey;
    }
    
    // If no direct API key, try to get from session data
    if (!apiKey && 'sessionApiKeys' in config && config.sessionApiKeys) {
      const sessionKeyData = config.sessionApiKeys[config.provider];
      if (sessionKeyData) {
        // Decrypt the API key from session storage
        try {
          apiKey = this.decryptApiKey(sessionKeyData);
        } catch (error) {
          console.error('Failed to decrypt API key from session:', error);
        }
      }
    }

    // If still no API key, try secure configuration
    if (!apiKey) {
      apiKey = await this.getApiKeyFromConfig(config.provider);
    }

    if (!apiKey) {
      throw new Error(`No API key available for provider: ${config.provider}`);
    }

    return apiKey;
  }

  /**
   * Decrypt an API key from session storage
   * @private
   */
  private decryptApiKey(encryptedData: { encrypted: string; iv: string }): string {
    const crypto = require('crypto');
    const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
    const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex');
    
    try {
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Get API key from secure configuration (with fallback to environment variables)
   */
  private async getApiKeyFromConfig(provider: AIProvider): Promise<string> {
    try {
      // Import at runtime to avoid circular dependencies
      const config = (await import('../config/env')).default;
      return await config.getProviderApiKey(provider);
    } catch (error) {
      console.error(`Failed to get API key for ${provider} from secure config:`, error);
      
      // Fallback to direct environment access
      switch (provider) {
        case 'openai':
          return process.env.OPENAI_API_KEY || '';
        case 'anthropic':
          return process.env.ANTHROPIC_API_KEY || '';
        case 'google':
          return process.env.GEMINI_API_KEY || '';
        case 'openrouter':
          return process.env.OPENROUTER_API_KEY || '';
        case 'ollama':
          return process.env.OLLAMA_API_KEY || 'local';
        case 'cohere':
          return process.env.COHERE_API_KEY || '';
        case 'mistral':
          return process.env.MISTRAL_API_KEY || '';
        case 'groq':
          return process.env.GROQ_API_KEY || '';
        default:
          throw new Error(`No API key found for provider: ${provider}`);
      }
    }
  }

  /**
   * Get default model for provider
   */
  private getDefaultModelForProvider(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'google':
        return 'gemini-2.5-flash';
      case 'openrouter':
        return 'openai/gpt-4';
      case 'ollama':
        return 'llama3.2:1b';
      case 'cohere':
        return 'command';
      case 'mistral':
        return 'mistral-tiny';
      case 'groq':
        return 'llama3-8b-8192';
      default:
        throw new Error(`No default model configured for provider: ${provider}`);
    }
  }

  /**
   * Get default parameters for provider
   */
  private getDefaultParametersForProvider(provider: AIProvider): ModelParameters {
    const baseParams = {
      temperature: 0.7,
      maxTokens: 4096
    };

    switch (provider) {
      case 'openai':
        return {
          ...baseParams,
          top_p: 1.0,
          presence_penalty: 0,
          frequency_penalty: 0
        };
      case 'anthropic':
        return {
          ...baseParams,
          top_p: 1.0,
          top_k: 0
        };
      case 'google':
        return {
          ...baseParams,
          topP: 1.0,
          topK: 40
        };
      case 'openrouter':
        return {
          ...baseParams,
          top_p: 1.0,
          presence_penalty: 0,
          frequency_penalty: 0
        };
      case 'ollama':
        return {
          ...baseParams,
          top_p: 1.0,
          top_k: 40
        };
      case 'cohere':
        return {
          ...baseParams,
          p: 1.0,
          k: 0
        };
      case 'mistral':
        return {
          ...baseParams,
          top_p: 1.0
        };
      case 'groq':
        return {
          ...baseParams,
          top_p: 1.0
        };
      default:
        return baseParams;
    }
  }

  /**
   * Get system instruction for SFL generation
   */
  private getSFLSystemInstruction(): string {
    return `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's goal and structure it into a detailed SFL-based prompt.
    If a source document is provided for stylistic reference, you MUST analyze its style (e.g., tone, complexity, vocabulary, sentence structure) and incorporate those stylistic qualities into the SFL fields and the final promptText. For example, update the 'desiredTone', 'aiPersona', and 'textualDirectives' to match the source. The generated 'promptText' should be a complete, standalone prompt that implicitly carries the desired style.
    The output MUST be a single, valid JSON object. Do not include any text, notes, or explanations outside of the JSON object.
    The JSON object should have the following structure: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string }.
    
    - title: Create a concise, descriptive title based on the user's goal.
    - promptText: Synthesize all the SFL elements into a complete, well-formed prompt that can be sent directly to an AI.
    - sflField (What is happening?): Analyze the subject matter.
    - sflTenor (Who is taking part?): Define the roles and relationships. The "targetAudience" field must be an array of strings, even if only one audience is identified.
    - sflMode (How is it being communicated?): Specify the format and structure of the output.
    - exampleOutput: Provide a brief but illustrative example of the expected output.
    - notes: Add any relevant notes or suggestions for the user.
    - All fields in the JSON must be filled with meaningful content.`;
  }

  /**
   * Get system instruction for SFL regeneration
   */
  private getSFLRegenerationSystemInstruction(): string {
    return `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to revise an existing SFL prompt based on a user's suggestion.
    The user will provide a JSON object representing the current prompt and a text string with their requested change.
    If a source document is provided (as part of the prompt object or separately), its style should be analyzed and take precedence, influencing the revision.
    You MUST return a single, valid JSON object that represents the *revised* prompt. Do not include any text, notes, or explanations outside of the JSON object.
    The output JSON object must have the exact same structure as the input, containing all the original fields, but with values updated according to the suggestion and stylistic source.
    The structure is: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string, "sourceDocument": { "name": string, "content": string } | undefined }.
    
    - Critically analyze the user's suggestion and apply it to all relevant fields in the prompt.
    - If a 'sourceDocument' is present, ensure its style is reflected in the revised SFL fields and 'promptText'.
    - The 'promptText' field is the most important; it must be re-written to reflect the change.
    - Other SFL fields (Field, Tenor, Mode) should be updated logically to align with the new 'promptText' and the user's suggestion.
    - Even update the 'title', 'exampleOutput', and 'notes' if the suggestion implies it.
    - Ensure 'targetAudience' remains an array of strings.
    - Preserve the 'sourceDocument' field in the output if it existed in the input.`;
  }

  /**
   * Get system instruction for workflow generation
   */
  private getWorkflowSystemInstruction(): string {
    return `You are an expert AI workflow orchestrator. Your task is to analyze a user's goal and generate a complete, multi-task workflow as a valid JSON object.
    
The user goal will be provided. Based on this, create a workflow with a series of tasks. The output MUST be a single, valid JSON object representing the workflow. Do not include any text or explanations outside the JSON.

The root JSON object must have 'name', 'description', and 'tasks' fields. Each task in the 'tasks' array must have the following fields:
- id: A unique string identifier for the task (e.g., "task-1").
- name: A short, descriptive name for the task.
- description: A one-sentence explanation of what the task does.
- type: One of "DATA_INPUT", "GEMINI_PROMPT", "IMAGE_ANALYSIS", "TEXT_MANIPULATION", "DISPLAY_CHART", "GEMINI_GROUNDED".
- dependencies: An array of task IDs that this task depends on. Empty for initial tasks.
- inputKeys: An array of strings representing keys from the Data Store needed for this task. Use dot notation for nested keys (e.g., "userInput.text").
- outputKey: A string for the key where the task's result will be stored in the Data Store.

Rules for specific task types:
- GEMINI_PROMPT/IMAGE_ANALYSIS: Must include a 'promptTemplate' field. Use {{key}} for placeholders.
- TEXT_MANIPULATION: Must include a 'functionBody' field containing a JavaScript function body as a string. E.g., "return \`Report: \${inputs.summary}\`".
- DATA_INPUT: Must include a 'staticValue' field. Use "{{userInput.text}}", "{{userInput.image}}", or "{{userInput.file}}" to get data from the user input area.
- DISPLAY_CHART: Must include a 'dataKey' field pointing to data in the Data Store suitable for charting.
- GEMINI_GROUNDED: For tasks requiring up-to-date information. Should have a 'promptTemplate'.`;
  }

  /**
   * Parse JSON content from AI-generated text
   */
  private parseJsonFromText(text: string): any {
    console.log("Attempting to parse JSON from text:", text.substring(0, 200) + "...");
    
    // Try multiple extraction strategies
    const strategies = [
      // Strategy 1: Extract code block content
      () => {
        const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
        const match = text.match(fenceRegex);
        return match && match[1] ? match[1].trim() : null;
      },
      
      // Strategy 2: Extract content between first { and last }
      () => {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          return text.substring(firstBrace, lastBrace + 1);
        }
        return null;
      },
      
      // Strategy 3: Try the text as-is if it starts with {
      () => {
        const trimmed = text.trim();
        return trimmed.startsWith('{') ? trimmed : null;
      },
      
      // Strategy 4: Remove common prefixes and try again
      () => {
        const cleaned = text.replace(/^(bash\s*|```\s*|json\s*|```json\s*)/i, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          return cleaned.substring(firstBrace, lastBrace + 1);
        }
        return null;
      }
    ];

    // Try each strategy
    for (let i = 0; i < strategies.length; i++) {
      const jsonStr = strategies[i]();
      if (jsonStr) {
        try {
          console.log(`Strategy ${i + 1} extracted JSON:`, jsonStr.substring(0, 100) + "...");
          const parsed = JSON.parse(jsonStr);
          console.log("Successfully parsed JSON with strategy", i + 1);
          return parsed;
        } catch (e) {
          console.log(`Strategy ${i + 1} failed to parse:`, e);
          continue;
        }
      }
    }

    // If all strategies fail, log detailed error info
    console.error("All JSON parsing strategies failed");
    console.error("Raw text length:", text.length);
    console.error("Raw text preview:", text.substring(0, 500));
    console.error("Text ends with:", text.substring(Math.max(0, text.length - 100)));
    
    throw new Error("The AI returned a response that could not be parsed as JSON using any available strategy.");
  }
}

// Export singleton instance
export default UnifiedAIService.getInstance();