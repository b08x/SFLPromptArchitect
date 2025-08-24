"use strict";
/**
 * @file unifiedAIService.ts
 * @description Unified AI service that provides dynamic provider switching while maintaining
 * compatibility with existing SFL prompt generation and workflow creation functionality.
 * Acts as a bridge between the legacy GeminiService interface and the new multi-provider architecture.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAIService = void 0;
const AIProviderFactory_1 = require("./ai/AIProviderFactory");
const geminiService_1 = __importDefault(require("./geminiService"));
/**
 * Unified AI service that supports multiple providers while maintaining backward compatibility
 */
class UnifiedAIService {
    constructor() {
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
    static getInstance() {
        if (!UnifiedAIService.instance) {
            UnifiedAIService.instance = new UnifiedAIService();
        }
        return UnifiedAIService.instance;
    }
    /**
     * Test a prompt with specified or default provider
     * Now supports session-aware API key retrieval
     */
    testPrompt(promptText, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.provider) || providerConfig.provider === 'google') {
                // Use legacy Gemini service for backward compatibility
                return yield geminiService_1.default.testPrompt(promptText);
            }
            // Use new provider system
            const aiService = yield this.createAIService(providerConfig);
            const request = {
                provider: providerConfig.provider,
                model: providerConfig.model || this.getDefaultModelForProvider(providerConfig.provider),
                parameters: providerConfig.parameters || this.getDefaultParametersForProvider(providerConfig.provider),
                prompt: promptText
            };
            const response = yield aiService.generateCompletion(request);
            return response.text;
        });
    }
    /**
     * Generate SFL prompt from goal with specified or default provider
     */
    generateSFLFromGoal(goal, sourceDocContent, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.provider) || providerConfig.provider === 'google') {
                // Use legacy Gemini service for backward compatibility
                return yield geminiService_1.default.generateSFLFromGoal(goal, sourceDocContent);
            }
            // For non-Gemini providers, we need to adapt the prompt structure
            const aiService = yield this.createAIService(providerConfig);
            const systemInstruction = this.getSFLSystemInstruction();
            const userContent = sourceDocContent
                ? `Source document for style reference:\n\n---\n\n${sourceDocContent}\n\n----\n\nUser's goal: "${goal}"`
                : `Here is the user's goal: "${goal}"`;
            const request = {
                provider: providerConfig.provider,
                model: providerConfig.model || this.getDefaultModelForProvider(providerConfig.provider),
                parameters: providerConfig.parameters || this.getDefaultParametersForProvider(providerConfig.provider),
                prompt: userContent,
                systemMessage: systemInstruction
            };
            const response = yield aiService.generateCompletion(request);
            const jsonData = this.parseJsonFromText(response.text);
            // Ensure targetAudience is an array
            if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
                jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
            }
            if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
                jsonData.sflTenor.targetAudience = [];
            }
            return jsonData;
        });
    }
    /**
     * Regenerate SFL prompt from suggestion with specified or default provider
     */
    regenerateSFLFromSuggestion(currentPrompt, suggestion, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.provider) || providerConfig.provider === 'google') {
                // Use legacy Gemini service for backward compatibility
                return yield geminiService_1.default.regenerateSFLFromSuggestion(currentPrompt, suggestion);
            }
            // For non-Gemini providers, we need to adapt the prompt structure
            const aiService = yield this.createAIService(providerConfig);
            const systemInstruction = this.getSFLRegenerationSystemInstruction();
            const { sourceDocument } = currentPrompt, promptForPayload = __rest(currentPrompt, ["sourceDocument"]);
            const userContent = `
    Here is the current prompt JSON:
    ${JSON.stringify(promptForPayload)}
    
    ${sourceDocument ? `This prompt is associated with the following source document for stylistic reference:\n---\n${sourceDocument.content}\n---\n` : ''}

    Here is my suggestion for how to change it:
    "${suggestion}"

    Now, provide the complete, revised JSON object.
    `;
            const request = {
                provider: providerConfig.provider,
                model: providerConfig.model || this.getDefaultModelForProvider(providerConfig.provider),
                parameters: providerConfig.parameters || this.getDefaultParametersForProvider(providerConfig.provider),
                prompt: userContent,
                systemMessage: systemInstruction
            };
            const response = yield aiService.generateCompletion(request);
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
            return jsonData;
        });
    }
    /**
     * Generate workflow from goal with specified or default provider
     */
    generateWorkflowFromGoal(goal, providerConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.provider) || providerConfig.provider === 'google') {
                // Use legacy Gemini service for backward compatibility
                return yield geminiService_1.default.generateWorkflowFromGoal(goal);
            }
            // For non-Gemini providers, we need to adapt the prompt structure
            const aiService = yield this.createAIService(providerConfig);
            const systemInstruction = this.getWorkflowSystemInstruction();
            const request = {
                provider: providerConfig.provider,
                model: providerConfig.model || this.getDefaultModelForProvider(providerConfig.provider),
                parameters: providerConfig.parameters || this.getDefaultParametersForProvider(providerConfig.provider),
                prompt: `User's goal: "${goal}"`,
                systemMessage: systemInstruction
            };
            const response = yield aiService.generateCompletion(request);
            const jsonData = this.parseJsonFromText(response.text);
            if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
                throw new Error("Generated workflow is missing required fields (name, description, tasks).");
            }
            jsonData.id = `wf-custom-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            return jsonData;
        });
    }
    /**
     * Create AI service instance for the specified provider
     * Now supports session-aware API key retrieval and secure configuration
     */
    createAIService(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config.provider) {
                throw new Error('Provider is required');
            }
            let apiKey;
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
                    }
                    catch (error) {
                        console.error('Failed to decrypt API key from session:', error);
                    }
                }
            }
            // If still no API key, try secure configuration
            if (!apiKey) {
                apiKey = yield this.getApiKeyFromConfig(config.provider);
            }
            if (!apiKey) {
                throw new Error(`No API key available for provider: ${config.provider}`);
            }
            let baseUrl = config.baseUrl;
            if (!baseUrl && 'sessionBaseUrls' in config && config.sessionBaseUrls) {
                baseUrl = config.sessionBaseUrls[config.provider];
            }
            const serviceConfig = {
                apiKey,
                baseUrl,
                timeout: 30000
            };
            return AIProviderFactory_1.aiProviderFactory.createService(config.provider, serviceConfig);
        });
    }
    /**
     * Decrypt an API key from session storage
     * @private
     */
    decryptApiKey(encryptedData) {
        const crypto = require('crypto');
        const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
        const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex');
        try {
            const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            console.error('Failed to decrypt API key:', error);
            throw new Error('Failed to decrypt API key');
        }
    }
    /**
     * Get API key from secure configuration (with fallback to environment variables)
     */
    getApiKeyFromConfig(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Import at runtime to avoid circular dependencies
                const config = (yield Promise.resolve().then(() => __importStar(require('../config/env')))).default;
                return yield config.getProviderApiKey(provider);
            }
            catch (error) {
                console.error(`Failed to get API key for ${provider} from secure config:`, error);
                // Fallback to direct environment access
                switch (provider) {
                    case 'openai':
                        return process.env.OPENAI_API_KEY || '';
                    case 'anthropic':
                        return process.env.ANTHROPIC_API_KEY || '';
                    case 'google':
                        return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
                    case 'openrouter':
                        return process.env.OPENROUTER_API_KEY || '';
                    default:
                        throw new Error(`No API key found for provider: ${provider}`);
                }
            }
        });
    }
    /**
     * Get default model for provider
     */
    getDefaultModelForProvider(provider) {
        switch (provider) {
            case 'openai':
                return 'gpt-4';
            case 'anthropic':
                return 'claude-3-5-sonnet-20241022';
            case 'google':
                return 'gemini-2.5-flash';
            case 'openrouter':
                return 'openai/gpt-4';
            default:
                throw new Error(`No default model configured for provider: ${provider}`);
        }
    }
    /**
     * Get default parameters for provider
     */
    getDefaultParametersForProvider(provider) {
        const baseParams = {
            temperature: 0.7,
            maxTokens: 4096
        };
        switch (provider) {
            case 'openai':
                return Object.assign(Object.assign({}, baseParams), { top_p: 1.0, presence_penalty: 0, frequency_penalty: 0 });
            case 'anthropic':
                return Object.assign(Object.assign({}, baseParams), { top_p: 1.0, top_k: 0 });
            case 'google':
                return Object.assign(Object.assign({}, baseParams), { topP: 1.0, topK: 40 });
            case 'openrouter':
                return Object.assign(Object.assign({}, baseParams), { top_p: 1.0, presence_penalty: 0, frequency_penalty: 0 });
            default:
                return baseParams;
        }
    }
    /**
     * Get system instruction for SFL generation
     */
    getSFLSystemInstruction() {
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
    getSFLRegenerationSystemInstruction() {
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
    getWorkflowSystemInstruction() {
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
     * Parse JSON content from AI-generated text (adapted from geminiService)
     */
    parseJsonFromText(text) {
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
                }
                catch (e) {
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
exports.UnifiedAIService = UnifiedAIService;
// Export singleton instance
exports.default = UnifiedAIService.getInstance();
