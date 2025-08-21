"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const orchestratorPrompt_1 = require("../prompts/orchestratorPrompt");
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
const ai = new genai_1.GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });
/**
 * Parses JSON content from AI-generated text using multiple extraction strategies.
 * Enhanced version of the parser from geminiService with better error handling.
 *
 * @param {string} text - The raw text response from the AI that contains JSON data.
 * @returns {any} The parsed JSON object.
 * @throws {Error} Throws an error if all parsing strategies fail.
 * @private
 */
const parseJsonFromText = (text) => {
    console.log("Orchestrator: Attempting to parse JSON from text:", text.substring(0, 200) + "...");
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
    for (let i = 0; i < strategies.length; i++) {
        const jsonStr = strategies[i]();
        if (jsonStr) {
            try {
                console.log(`Orchestrator: Strategy ${i + 1} extracted JSON:`, jsonStr.substring(0, 100) + "...");
                const parsed = JSON.parse(jsonStr);
                console.log("Orchestrator: Successfully parsed JSON with strategy", i + 1);
                return parsed;
            }
            catch (e) {
                console.log(`Orchestrator: Strategy ${i + 1} failed to parse:`, e);
                continue;
            }
        }
    }
    console.error("Orchestrator: All JSON parsing strategies failed");
    throw new Error("The AI orchestrator returned a response that could not be parsed as JSON.");
};
/**
 * Validates that a workflow object conforms to the expected structure and business rules.
 *
 * @param {any} workflow - The workflow object to validate
 * @returns {string[]} Array of validation error messages, empty if valid
 * @private
 */
const validateWorkflow = (workflow) => {
    const errors = [];
    // Check required top-level fields
    if (!workflow.name || typeof workflow.name !== 'string') {
        errors.push("Workflow must have a 'name' field of type string");
    }
    if (!workflow.description || typeof workflow.description !== 'string') {
        errors.push("Workflow must have a 'description' field of type string");
    }
    if (!Array.isArray(workflow.tasks)) {
        errors.push("Workflow must have a 'tasks' field that is an array");
        return errors; // Can't validate tasks if it's not an array
    }
    if (workflow.tasks.length === 0) {
        errors.push("Workflow must contain at least one task");
    }
    // Validate each task
    const taskIds = new Set();
    workflow.tasks.forEach((task, index) => {
        const taskPrefix = `Task ${index + 1} (${task.id || 'unknown'})`;
        // Required fields
        if (!task.id || typeof task.id !== 'string') {
            errors.push(`${taskPrefix}: must have a unique 'id' field of type string`);
        }
        else if (taskIds.has(task.id)) {
            errors.push(`${taskPrefix}: duplicate task ID '${task.id}'`);
        }
        else {
            taskIds.add(task.id);
        }
        if (!task.name || typeof task.name !== 'string') {
            errors.push(`${taskPrefix}: must have a 'name' field of type string`);
        }
        if (!task.description || typeof task.description !== 'string') {
            errors.push(`${taskPrefix}: must have a 'description' field of type string`);
        }
        if (!task.type || typeof task.type !== 'string') {
            errors.push(`${taskPrefix}: must have a 'type' field of type string`);
        }
        if (!Array.isArray(task.dependencies)) {
            errors.push(`${taskPrefix}: must have a 'dependencies' field that is an array`);
        }
        if (!Array.isArray(task.inputKeys)) {
            errors.push(`${taskPrefix}: must have an 'inputKeys' field that is an array`);
        }
        if (!task.outputKey || typeof task.outputKey !== 'string') {
            errors.push(`${taskPrefix}: must have an 'outputKey' field of type string`);
        }
        // Validate dependencies reference existing tasks
        if (Array.isArray(task.dependencies)) {
            task.dependencies.forEach((depId) => {
                if (typeof depId !== 'string') {
                    errors.push(`${taskPrefix}: dependency must be a string, got ${typeof depId}`);
                }
                // Note: We can't validate if the dependency exists yet since we're processing tasks in order
            });
        }
        // Type-specific validations
        if (task.type) {
            switch (task.type) {
                case 'GEMINI_PROMPT':
                case 'IMAGE_ANALYSIS':
                case 'GEMINI_GROUNDED':
                    if (!task.promptTemplate || typeof task.promptTemplate !== 'string') {
                        errors.push(`${taskPrefix}: type '${task.type}' requires a 'promptTemplate' field of type string`);
                    }
                    break;
                case 'TEXT_MANIPULATION':
                    if (!task.functionBody || typeof task.functionBody !== 'string') {
                        errors.push(`${taskPrefix}: type 'TEXT_MANIPULATION' requires a 'functionBody' field of type string`);
                    }
                    break;
                case 'DATA_INPUT':
                    if (task.staticValue === undefined) {
                        errors.push(`${taskPrefix}: type 'DATA_INPUT' requires a 'staticValue' field`);
                    }
                    break;
                case 'DISPLAY_CHART':
                    if (!task.dataKey || typeof task.dataKey !== 'string') {
                        errors.push(`${taskPrefix}: type 'DISPLAY_CHART' requires a 'dataKey' field of type string`);
                    }
                    break;
            }
        }
    });
    // Validate that all dependency references exist
    workflow.tasks.forEach((task) => {
        if (Array.isArray(task.dependencies)) {
            task.dependencies.forEach((depId) => {
                if (!taskIds.has(depId)) {
                    errors.push(`Task '${task.id}': references non-existent dependency '${depId}'`);
                }
            });
        }
    });
    return errors;
};
/**
 * Detects circular dependencies in a workflow task graph.
 *
 * @param {Task[]} tasks - Array of workflow tasks to check
 * @returns {boolean} True if circular dependencies are detected
 * @private
 */
const hasCircularDependencies = (tasks) => {
    const visited = new Set();
    const recursionStack = new Set();
    const taskMap = new Map();
    tasks.forEach(task => taskMap.set(task.id, task));
    const dfsVisit = (taskId) => {
        if (recursionStack.has(taskId)) {
            return true; // Circular dependency detected
        }
        if (visited.has(taskId)) {
            return false; // Already processed
        }
        visited.add(taskId);
        recursionStack.add(taskId);
        const task = taskMap.get(taskId);
        if (task) {
            for (const depId of task.dependencies) {
                if (dfsVisit(depId)) {
                    return true;
                }
            }
        }
        recursionStack.delete(taskId);
        return false;
    };
    // Check each task
    for (const task of tasks) {
        if (!visited.has(task.id)) {
            if (dfsVisit(task.id)) {
                return true;
            }
        }
    }
    return false;
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
    generateWorkflow(userRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!API_KEY) {
                return {
                    success: false,
                    error: "Gemini API Key is not configured. Cannot generate workflow."
                };
            }
            if (!(userRequest === null || userRequest === void 0 ? void 0 : userRequest.trim())) {
                return {
                    success: false,
                    error: "User request cannot be empty."
                };
            }
            try {
                console.log("Orchestrator: Generating workflow for request:", userRequest);
                const orchestratorPrompt = (0, orchestratorPrompt_1.buildOrchestratorPrompt)(userRequest);
                console.log("Orchestrator: Sending request to Gemini API");
                const response = yield ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: "user", parts: [{ text: orchestratorPrompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.3, // Lower temperature for more consistent structure
                        topK: 40,
                        topP: 0.8
                    },
                });
                const text = ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "{}";
                console.log("Orchestrator: Received response from API, parsing...");
                let workflowData;
                try {
                    workflowData = parseJsonFromText(text);
                }
                catch (parseError) {
                    console.error("Orchestrator: Failed to parse JSON:", parseError);
                    return {
                        success: false,
                        error: "Failed to parse workflow structure from AI response.",
                    };
                }
                // Validate the workflow structure
                const validationErrors = validateWorkflow(workflowData);
                if (validationErrors.length > 0) {
                    console.error("Orchestrator: Validation errors:", validationErrors);
                    return {
                        success: false,
                        error: "Generated workflow failed validation.",
                        validationErrors
                    };
                }
                // Check for circular dependencies
                if (hasCircularDependencies(workflowData.tasks)) {
                    return {
                        success: false,
                        error: "Generated workflow contains circular dependencies."
                    };
                }
                // Generate a unique ID for the workflow
                workflowData.id = `orchestrated-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                console.log(`Orchestrator: Successfully generated workflow "${workflowData.name}" with ${workflowData.tasks.length} tasks`);
                return {
                    success: true,
                    workflow: workflowData
                };
            }
            catch (error) {
                console.error("Orchestrator: Error during workflow generation:", error);
                if (error instanceof Error) {
                    return {
                        success: false,
                        error: `Workflow generation failed: ${error.message}`
                    };
                }
                return {
                    success: false,
                    error: "An unknown error occurred during workflow generation."
                };
            }
        });
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
    validateWorkflowStructure(workflow) {
        const errors = validateWorkflow(workflow);
        if (errors.length === 0 && workflow.tasks && hasCircularDependencies(workflow.tasks)) {
            errors.push("Workflow contains circular dependencies");
        }
        return errors;
    }
    /**
     * Checks if the orchestrator service is properly configured and ready to use.
     *
     * @returns {boolean} True if the service is ready, false otherwise
     *
     * @since 2.1.0
     */
    isConfigured() {
        return !!API_KEY;
    }
}
/**
 * @exports {OrchestratorService} orchestratorService
 * @description Singleton instance of the OrchestratorService class, ready to be used across the application.
 * This exported instance provides AI-powered workflow generation functionality.
 *
 * @since 2.1.0
 */
exports.default = new OrchestratorService();
