/**
 * @file orchestratorService.ts
 * @description Service for AI-powered workflow orchestration. This service takes high-level user requests
 * and uses LLM-powered decomposition to generate complete, executable workflows automatically.
 * 
 * @requires @google/genai
 * @requires ../types
 * @requires ../prompts/orchestratorPrompt
 * @since 2.1.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Workflow, Task } from '../types';
import { buildOrchestratorPrompt } from '../prompts/orchestratorPrompt';
import { validateWorkflow, hasCircularDependencies, ValidationResult, ValidatedWorkflow } from '../validation/workflowSchemas';
import { createGeminiOrchestrationService, GeminiOrchestrationService } from './ai/GeminiService';
import { AIServiceConfig } from './ai/BaseAIService';

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
 * @constant {GeminiOrchestrationService} orchestrationService
 * @description Enhanced Gemini service with guaranteed JSON mode for orchestration.
 * @private
 */
const orchestrationService = createGeminiOrchestrationService({
  apiKey: API_KEY || "MISSING_API_KEY",
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
});

/**
 * @interface OrchestratorResponse
 * @description Represents the response from the orchestrator service with enhanced error details
 */
interface OrchestratorResponse {
  success: boolean;
  workflow?: Workflow;
  error?: string;
  validationErrors?: string[];
  errorType?: 'JSON_PARSE_ERROR' | 'SCHEMA_VALIDATION_ERROR' | 'CIRCULAR_DEPENDENCY_ERROR' | 'API_ERROR' | 'CONFIGURATION_ERROR';
  details?: Record<string, any>;
}

/**
 * Parses JSON content from AI-generated response using guaranteed JSON mode.
 * Since the AI is configured with JSON mode, the response should be valid JSON.
 * 
 * @param {string} text - The JSON response from the AI
 * @returns {any} The parsed JSON object
 * @throws {Error} Throws an error if JSON parsing fails
 * @private
 */
const parseJsonResponse = (text: string): any => {
  console.log("Orchestrator: [JSON_PARSE] Starting JSON parsing");
  console.log("Orchestrator: [JSON_PARSE] Response length:", text.length);
  console.log("Orchestrator: [JSON_PARSE] First 200 chars:", text.substring(0, 200));
  
  try {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Response is empty");
    }
    
    const parsed = JSON.parse(trimmed);
    console.log("Orchestrator: [JSON_PARSE] Successfully parsed JSON response");
    console.log("Orchestrator: [JSON_PARSE] Parsed object type:", typeof parsed);
    console.log("Orchestrator: [JSON_PARSE] Has workflow structure:", !!parsed.name && !!parsed.tasks);
    return parsed;
  } catch (error: unknown) {
    console.error("Orchestrator: [JSON_PARSE] JSON parsing failed:", error);
    console.error("Orchestrator: [JSON_PARSE] Error type:", error instanceof Error ? error.constructor.name : 'Unknown');
    console.error("Orchestrator: [JSON_PARSE] Raw response (first 500 chars):", text.substring(0, 500));
    console.error("Orchestrator: [JSON_PARSE] Response contains JSON markers:", text.includes('{') && text.includes('}'));
    throw new Error(`AI response was not valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates workflow structure using comprehensive Zod schemas.
 * This replaces the manual validation with type-safe schema validation.
 * 
 * @param {any} workflow - The workflow object to validate
 * @returns {ValidationResult} Detailed validation result with errors
 * @private
 */
const validateWorkflowStructure = (workflow: any): ValidationResult => {
  console.log("Orchestrator: [VALIDATION] Starting Zod schema validation");
  console.log("Orchestrator: [VALIDATION] Workflow name:", workflow?.name || 'MISSING');
  console.log("Orchestrator: [VALIDATION] Task count:", Array.isArray(workflow?.tasks) ? workflow.tasks.length : 'INVALID');
  
  const validationResult = validateWorkflow(workflow);
  
  if (validationResult.success) {
    console.log("Orchestrator: [VALIDATION] Schema validation passed successfully");
    console.log("Orchestrator: [VALIDATION] Validated workflow name:", validationResult.data?.name);
    console.log("Orchestrator: [VALIDATION] Validated task count:", validationResult.data?.tasks.length);
  } else {
    console.error("Orchestrator: [VALIDATION] Schema validation failed");
    console.error("Orchestrator: [VALIDATION] Total errors:", validationResult.errors?.length || 0);
    console.error("Orchestrator: [VALIDATION] Error details:", validationResult.errors);
    if (validationResult.fieldErrors) {
      console.error("Orchestrator: [VALIDATION] Field-specific errors:", validationResult.fieldErrors);
    }
  }
  
  return validationResult;
};


/**
 * @class OrchestratorService
 * @description Service class for AI-powered workflow orchestration.
 * Provides methods for generating complete workflows from high-level user requests.
 * 
 * @since 2.1.0
 */
class OrchestratorService {
  /**
   * Generates a complete workflow from a high-level user request using AI orchestration.
   * This method uses advanced prompting techniques to decompose complex requests into
   * structured, executable workflows with proper task dependencies and data flow.
   * 
   * @param {string} userRequest - The high-level request describing what the user wants to accomplish
   * @returns {Promise<OrchestratorResponse>} A promise that resolves to the orchestration result
   * 
   * @example
   * ```typescript
   * const orchestrator = new OrchestratorService();
   * const result = await orchestrator.generateWorkflow(
   *   "Analyze customer feedback for sentiment and generate a report"
   * );
   * if (result.success) {
   *   console.log(`Generated workflow: ${result.workflow.name}`);
   *   console.log(`Tasks: ${result.workflow.tasks.length}`);
   * }
   * ```
   * 
   * @since 2.1.0
   */
  async generateWorkflow(userRequest: string): Promise<OrchestratorResponse> {
    if (!API_KEY) {
      return {
        success: false,
        error: "Gemini API Key is not configured. Cannot generate workflow.",
        errorType: 'CONFIGURATION_ERROR'
      };
    }

    if (!userRequest?.trim()) {
      return {
        success: false,
        error: "User request cannot be empty.",
        errorType: 'CONFIGURATION_ERROR'
      };
    }

    try {
      console.log("Orchestrator: [REQUEST] Starting workflow generation");
      console.log("Orchestrator: [REQUEST] User request length:", userRequest.length);
      console.log("Orchestrator: [REQUEST] User request:", userRequest);

      const orchestratorPrompt = buildOrchestratorPrompt(userRequest);
      
      console.log("Orchestrator: [API_CALL] Preparing Gemini API request");
      console.log("Orchestrator: [API_CALL] Using guaranteed JSON mode");
      console.log("Orchestrator: [API_CALL] Model: gemini-2.5-flash");
      console.log("Orchestrator: [API_CALL] Temperature: 0.3");
      const response = await orchestrationService.generateOrchestrationCompletion({
        provider: 'google',
        prompt: orchestratorPrompt,
        model: 'gemini-2.5-flash',
        parameters: {
          temperature: 0.3, // Lower temperature for more consistent structure
          topK: 40,
          topP: 0.8
        }
      });

      const text = response.text || "{}";
      console.log("Orchestrator: [API_RESPONSE] Received response from Gemini API");
      console.log("Orchestrator: [API_RESPONSE] Response type:", typeof response);
      console.log("Orchestrator: [API_RESPONSE] Has text field:", !!response.text);
      console.log("Orchestrator: [API_RESPONSE] Starting JSON parsing...");

      // Parse JSON response (guaranteed JSON mode)
      let workflowData: any;
      try {
        workflowData = parseJsonResponse(text);
      } catch (parseError) {
        console.error("Orchestrator: JSON parsing failed:", parseError);
        return {
          success: false,
          error: parseError instanceof Error ? parseError.message : "Failed to parse AI response as JSON",
          errorType: 'JSON_PARSE_ERROR',
          details: {
            originalError: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
            responseLength: text.length,
            responsePreview: text.substring(0, 100)
          }
        };
      }

      // Validate the workflow structure using Zod schemas
      const validationResult = validateWorkflowStructure(workflowData);
      if (!validationResult.success) {
        return {
          success: false,
          error: "Generated workflow failed schema validation.",
          errorType: 'SCHEMA_VALIDATION_ERROR',
          validationErrors: validationResult.errors,
          details: {
            fieldErrors: validationResult.fieldErrors,
            totalErrors: validationResult.errors?.length || 0
          }
        };
      }

      // Check for circular dependencies using the validated workflow
      const validatedWorkflow = validationResult.data!;
      if (hasCircularDependencies(validatedWorkflow)) {
        console.error("Orchestrator: [DEPENDENCIES] Circular dependencies detected in validated workflow");
        console.error("Orchestrator: [DEPENDENCIES] Task count:", validatedWorkflow.tasks.length);
        console.error("Orchestrator: [DEPENDENCIES] Task IDs:", validatedWorkflow.tasks.map(t => t.id));
        return {
          success: false,
          error: "Generated workflow contains circular dependencies.",
          errorType: 'CIRCULAR_DEPENDENCY_ERROR'
        };
      }

      // Generate a unique ID and create a proper Workflow object for database storage
      const workflowId = `orchestrated-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const now = new Date().toISOString();
      
      const workflowForDatabase: Workflow = {
        id: workflowId,
        user_id: '', // Will be set by the calling service
        name: validatedWorkflow.name,
        graph_data: {
          name: validatedWorkflow.name,
          description: validatedWorkflow.description,
          tasks: validatedWorkflow.tasks
        },
        created_at: now,
        updated_at: now,
        tasks: validatedWorkflow.tasks
      };

      console.log("Orchestrator: [SUCCESS] Workflow generation completed successfully");
      console.log(`Orchestrator: [SUCCESS] Generated workflow: "${workflowForDatabase.name}"`); 
      console.log(`Orchestrator: [SUCCESS] Task count: ${workflowForDatabase.tasks?.length || 0}`);
      console.log(`Orchestrator: [SUCCESS] Workflow ID: ${workflowForDatabase.id}`);
      console.log("Orchestrator: [SUCCESS] Task types:", [...new Set((workflowForDatabase.tasks || []).map(t => t.type))]);

      return {
        success: true,
        workflow: workflowForDatabase
      };

    } catch (error: unknown) {
      console.error("Orchestrator: Error during workflow generation:", error);
      
      if (error instanceof Error) {
        return {
          success: false,
          error: `Workflow generation failed: ${error.message}`,
          errorType: 'API_ERROR',
          details: {
            originalError: error.message
          }
        };
      }
      
      return {
        success: false,
        error: "An unknown error occurred during workflow generation.",
        errorType: 'API_ERROR'
      };
    }
  }

  /**
   * Validates an existing workflow structure for completeness and correctness.
   * Can be used to validate workflows before execution or after modifications.
   * 
   * @param {Workflow} workflow - The workflow to validate
   * @returns {string[]} Array of validation error messages, empty if valid
   * 
   * @example
   * ```typescript
   * const orchestrator = new OrchestratorService();
   * const errors = orchestrator.validateWorkflowStructure(myWorkflow);
   * if (errors.length === 0) {
   *   console.log("Workflow is valid");
   * } else {
   *   console.error("Validation errors:", errors);
   * }
   * ```
   * 
   * @since 2.1.0
   */
  validateWorkflowStructure(workflow: Workflow): string[] {
    const validationResult = validateWorkflow(workflow);
    
    if (!validationResult.success) {
      return validationResult.errors || [];
    }
    
    // Check for circular dependencies if validation passed
    if (hasCircularDependencies(validationResult.data!)) {
      return ["Workflow contains circular dependencies"];
    }

    return [];
  }

  /**
   * Checks if the orchestrator service is properly configured and ready to use.
   * 
   * @returns {boolean} True if the service is ready, false otherwise
   * 
   * @since 2.1.0
   */
  isConfigured(): boolean {
    return !!API_KEY && orchestrationService.isConfigured();
  }
}

/**
 * @exports {OrchestratorService} orchestratorService
 * @description Singleton instance of the OrchestratorService class, ready to be used across the application.
 * This exported instance provides AI-powered workflow generation functionality.
 * 
 * @since 2.1.0
 */
export default new OrchestratorService();