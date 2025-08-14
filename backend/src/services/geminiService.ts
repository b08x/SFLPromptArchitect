/**
 * @file geminiService.ts
 * @description Service module for interacting with Google's Gemini AI API.
 * Provides functionality for prompt testing, SFL prompt generation, and workflow creation
 * using the Gemini language model. This service handles API communication, response parsing,
 * and error handling for all Gemini-related operations.
 * 
 * @requires @google/genai
 * @requires ../types
 * @since 0.5.1
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PromptSFL, Workflow } from '../types';

/**
 * @constant {string|undefined} API_KEY
 * @description The API key for accessing Google's Gemini API, retrieved from environment variables.
 * @private
 */
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable.");
}

/**
 * @constant {GoogleGenAI} ai
 * @description Initialized GoogleGenAI client instance for API communication.
 * @private
 */
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

/**
 * Parses JSON content from AI-generated text using multiple extraction strategies.
 * This utility function handles various formats that the AI might return, including
 * code blocks, plain JSON, and text with prefixes.
 * 
 * @param {string} text - The raw text response from the AI that contains JSON data.
 * @returns {any} The parsed JSON object.
 * @throws {Error} Throws an error if all parsing strategies fail.
 * 
 * @example
 * ```typescript
 * const aiResponse = "```json\n{\"key\": \"value\"}\n```";
 * const parsed = parseJsonFromText(aiResponse);
 * console.log(parsed); // { key: "value" }
 * ```
 * 
 * @since 0.5.1
 * @private
 */
const parseJsonFromText = (text: string): any => {
  console.log("Attempting to parse JSON from text:", text.substring(0, 200) + "...");
  
  // Try multiple extraction strategies
  const strategies = [
    // Strategy 1: Extract code block content (original)
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
};

/**
 * @class GeminiService
 * @description Service class for interacting with Google's Gemini AI API.
 * Provides methods for testing prompts, generating SFL-structured prompts from goals,
 * regenerating prompts based on suggestions, and creating workflows.
 * 
 * @since 0.5.1
 */
class GeminiService {
  /**
   * Tests a prompt by sending it to the Gemini API and returning the response.
   * This method is used for validating prompt effectiveness and getting sample responses.
   * 
   * @param {string} promptText - The prompt text to test with the Gemini model.
   * @returns {Promise<string>} A promise that resolves to the AI-generated response text.
   * @throws {Error} Throws an error if the API key is not configured or if the API call fails.
   * 
   * @example
   * ```typescript
   * const service = new GeminiService();
   * try {
   *   const response = await service.testPrompt("Explain quantum computing briefly.");
   *   console.log("AI Response:", response);
   * } catch (error) {
   *   console.error("Test failed:", error.message);
   * }
   * ```
   * 
   * @since 0.5.1
   */
  async testPrompt(promptText: string): Promise<string> {
    if (!API_KEY) {
      throw new Error("Gemini API Key is not configured.");
    }
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: "user", parts: [{ text: promptText }] }],
      });
      
      return response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    } catch (error: unknown) {
      console.error("Error calling Gemini API:", error);
      if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
      }
      throw new Error("An unknown error occurred while contacting the Gemini API.");
    }
  }

  /**
   * Generates a complete SFL (Systemic Functional Linguistics) prompt structure from a high-level goal.
   * This method uses AI to analyze the goal and create structured prompt components including
   * Field (what), Tenor (who), and Mode (how) aspects. Optionally incorporates style from a source document.
   * 
   * @param {string} goal - A natural language description of what the user wants to achieve.
   * @param {string} [sourceDocContent] - Optional content from a source document to provide stylistic reference.
   * @returns {Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>} A promise resolving to the generated SFL prompt structure.
   * @throws {Error} Throws an error if the API key is not configured or if the generation fails.
   * 
   * @example
   * ```typescript
   * const service = new GeminiService();
   * const goal = "Create a formal business proposal for a new software project";
   * const sourceDoc = "Sample business document text for style reference...";
   * try {
   *   const sflPrompt = await service.generateSFLFromGoal(goal, sourceDoc);
   *   console.log("Generated SFL prompt:", sflPrompt.title);
   * } catch (error) {
   *   console.error("Generation failed:", error.message);
   * }
   * ```
   * 
   * @since 0.5.1
   */
  async generateSFLFromGoal(goal: string, sourceDocContent?: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> {
    if (!API_KEY) {
        throw new Error("Gemini API Key is not configured.");
    }
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's goal and structure it into a detailed SFL-based prompt.\n    If a source document is provided for stylistic reference, you MUST analyze its style (e.g., tone, complexity, vocabulary, sentence structure) and incorporate those stylistic qualities into the SFL fields and the final promptText. For example, update the 'desiredTone', 'aiPersona', and 'textualDirectives' to match the source. The generated 'promptText' should be a complete, standalone prompt that implicitly carries the desired style.\n    The output MUST be a single, valid JSON object. Do not include any text, notes, or explanations outside of the JSON object.\n    The JSON object should have the following structure: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string }.\n    \n    - title: Create a concise, descriptive title based on the user's goal.\n    - promptText: Synthesize all the SFL elements into a complete, well-formed prompt that can be sent directly to an AI.\n    - sflField (What is happening?): Analyze the subject matter.\n    - sflTenor (Who is taking part?): Define the roles and relationships. The "targetAudience" field must be an array of strings, even if only one audience is identified.\n    - sflMode (How is it being communicated?): Specify the format and structure of the output.\n    - exampleOutput: Provide a brief but illustrative example of the expected output.\n    - notes: Add any relevant notes or suggestions for the user.\n    - All fields in the JSON must be filled with meaningful content.`;
    
    const userContent = sourceDocContent
      ? `Source document for style reference:\n\n---\n\n${sourceDocContent}\n\n----\n\nUser's goal: "${goal}"`
      : `Here is the user's goal: "${goal}"`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            config: {
                responseMimeType: "application/json",
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonData = parseJsonFromText(text);
        
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
            jsonData.sflTenor.targetAudience = [];
        }

        return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for SFL generation:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the SFL prompt.");
    }
  }

  /**
   * Regenerates an existing SFL prompt based on a user's suggestion for improvement.
   * This method takes an existing prompt and a natural language suggestion, then uses AI
   * to intelligently modify the prompt structure while maintaining SFL principles.
   * 
   * @param {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>} currentPrompt - The existing prompt to be modified.
   * @param {string} suggestion - A natural language suggestion for how to improve or change the prompt.
   * @returns {Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>} A promise resolving to the regenerated SFL prompt structure.
   * @throws {Error} Throws an error if the API key is not configured or if the regeneration fails.
   * 
   * @example
   * ```typescript
   * const service = new GeminiService();
   * const existingPrompt = { // ... existing SFL prompt structure };
   * const suggestion = "Make the tone more casual and add examples";
   * try {
   *   const improvedPrompt = await service.regenerateSFLFromSuggestion(existingPrompt, suggestion);
   *   console.log("Improved prompt:", improvedPrompt.title);
   * } catch (error) {
   *   console.error("Regeneration failed:", error.message);
   * }
   * ```
   * 
   * @since 0.5.1
   */
  async regenerateSFLFromSuggestion(
    currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>,
    suggestion: string
  ): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> {
    if (!API_KEY) {
        throw new Error("Gemini API Key is not configured.");
    }
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to revise an existing SFL prompt based on a user's suggestion.\n    The user will provide a JSON object representing the current prompt and a text string with their requested change.\n    If a source document is provided (as part of the prompt object or separately), its style should be analyzed and take precedence, influencing the revision.\n    You MUST return a single, valid JSON object that represents the *revised* prompt. Do not include any text, notes, or explanations outside of the JSON object.\n    The output JSON object must have the exact same structure as the input, containing all the original fields, but with values updated according to the suggestion and stylistic source.\n    The structure is: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string, "sourceDocument": { "name": string, "content": string } | undefined }.\n    \n    - Critically analyze the user's suggestion and apply it to all relevant fields in the prompt.\n    - If a 'sourceDocument' is present, ensure its style is reflected in the revised SFL fields and 'promptText'.\n    - The 'promptText' field is the most important; it must be re-written to reflect the change.\n    - Other SFL fields (Field, Tenor, Mode) should be updated logically to align with the new 'promptText' and the user's suggestion.\n    - Even update the 'title', 'exampleOutput', and 'notes' if the suggestion implies it.\n    - Ensure 'targetAudience' remains an array of strings.\n    - Preserve the 'sourceDocument' field in the output if it existed in the input.`;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceDocument, ...promptForPayload } = currentPrompt;

    const userContent = `
    Here is the current prompt JSON:
    ${JSON.stringify(promptForPayload)}
    
    ${sourceDocument ? `This prompt is associated with the following source document for stylistic reference:\n---\n${sourceDocument.content}\n---\n` : ''}

    Here is my suggestion for how to change it:
    "${suggestion}"

    Now, provide the complete, revised JSON object.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            config: {
                responseMimeType: "application/json",
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonData = parseJsonFromText(text);
        
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
            jsonData.sflTenor.targetAudience = [];
        }
        
        // Preserve the source document from the original prompt
        jsonData.sourceDocument = sourceDocument;

        return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for SFL regeneration:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while regenerating the SFL prompt.");
    }
  }

  /**
   * Generates a complete workflow structure from a high-level goal description.
   * This method uses AI to analyze a user's goal and create a multi-task workflow
   * with appropriate task types, dependencies, and data flow connections.
   * 
   * @param {string} goal - A natural language description of the multi-step process to automate.
   * @returns {Promise<Workflow>} A promise resolving to the generated workflow structure with tasks.
   * @throws {Error} Throws an error if the API key is not configured or if the workflow generation fails.
   * 
   * @example
   * ```typescript
   * const service = new GeminiService();
   * const goal = "Analyze customer feedback sentiment and generate a summary report";
   * try {
   *   const workflow = await service.generateWorkflowFromGoal(goal);
   *   console.log(`Generated workflow "${workflow.name}" with ${workflow.tasks.length} tasks`);
   * } catch (error) {
   *   console.error("Workflow generation failed:", error.message);
   * }
   * ```
   * 
   * @since 0.5.1
   */
  async generateWorkflowFromGoal(goal: string): Promise<Workflow> {
    if (!API_KEY) {
        throw new Error("Gemini API Key is not configured.");
    }

    const systemInstruction = `You are an expert AI workflow orchestrator. Your task is to analyze a user's goal and generate a complete, multi-task workflow as a valid JSON object.\n    \nThe user goal will be provided. Based on this, create a workflow with a series of tasks. The output MUST be a single, valid JSON object representing the workflow. Do not include any text or explanations outside the JSON.\n\nThe root JSON object must have 'name', 'description', and 'tasks' fields. Each task in the 'tasks' array must have the following fields:\n- id: A unique string identifier for the task (e.g., "task-1").\n- name: A short, descriptive name for the task.\n- description: A one-sentence explanation of what the task does.\n- type: One of "DATA_INPUT", "GEMINI_PROMPT", "IMAGE_ANALYSIS", "TEXT_MANIPULATION", "DISPLAY_CHART", "GEMINI_GROUNDED".\n- dependencies: An array of task IDs that this task depends on. Empty for initial tasks.\n- inputKeys: An array of strings representing keys from the Data Store needed for this task. Use dot notation for nested keys (e.g., "userInput.text").\n- outputKey: A string for the key where the task's result will be stored in the Data Store.\n\nRules for specific task types:\n- GEMINI_PROMPT/IMAGE_ANALYSIS: Must include a 'promptTemplate' field. Use {{key}} for placeholders.\n- TEXT_MANIPULATION: Must include a 'functionBody' field containing a JavaScript function body as a string. E.g., "return \`Report: \${inputs.summary}\`".\n- DATA_INPUT: Must include a 'staticValue' field. Use "{{userInput.text}}", "{{userInput.image}}", or "{{userInput.file}}" to get data from the user input area.\n- DISPLAY_CHART: Must include a 'dataKey' field pointing to data in the Data Store suitable for charting.\n- GEMINI_GROUNDED: For tasks requiring up-to-date information. Should have a 'promptTemplate'.\n\nExample Goal: "Analyze a user-provided text for sentiment and then summarize it."\nExample Output:\n{\n  "name": "Sentiment Analysis and Summary",\n  "description": "A workflow that first determines the sentiment of a text and then provides a concise summary.",\n  "tasks": [\n    { "id": "task-1", "name": "Get User Text", "description": "Receives the text to be analyzed from the user.", "type": "DATA_INPUT", "dependencies": [], "inputKeys": [], "outputKey": "inputText", "staticValue": "{{userInput.text}}" },\n    { "id": "task-2", "name": "Analyze Sentiment", "description": "Determines if the text is positive, negative, or neutral.", "type": "GEMINI_PROMPT", "dependencies": ["task-1"], "inputKeys": ["inputText"], "outputKey": "sentiment", "promptTemplate": "Analyze the sentiment of the following text and return only 'positive', 'negative', or 'neutral':\\n\\n{{inputText}}" },\n    { "id": "task-3", "name": "Summarize Text", "description": "Creates a one-sentence summary of the text.", "type": "GEMINI_PROMPT", "dependencies": ["task-1"], "inputKeys": ["inputText"], "outputKey": "summary", "promptTemplate": "Summarize the following text in a single sentence:\\n\\n{{inputText}}" },\n    { "id": "task-4", "name": "Format Report", "description": "Combines the sentiment and summary into a final report.", "type": "TEXT_MANIPULATION", "dependencies": ["task-2", "task-3"], "inputKeys": ["sentiment", "summary"], "outputKey": "finalReport", "functionBody": "return \`Sentiment: \${inputs.sentiment.toUpperCase()}\nSummary: \${inputs.summary}\`" }\n  ]\n}`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: `User's goal: "${goal}"` }] }],
            config: {
                responseMimeType: "application/json",
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonData = parseJsonFromText(text);
        
        if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
            throw new Error("Generated workflow is missing required fields (name, description, tasks).");
        }
        
        jsonData.id = `wf-custom-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

        return jsonData as Workflow;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for Workflow generation:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the workflow.");
    }
  }
}

/**
 * @exports {GeminiService} geminiService
 * @description Singleton instance of the GeminiService class, ready to be used across the application.
 * This exported instance provides all Gemini AI functionality including prompt testing,
 * SFL generation, and workflow creation.
 * 
 * @since 0.5.1
 */
export default new GeminiService();