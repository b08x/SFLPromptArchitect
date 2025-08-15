"use strict";
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
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable.");
}
const ai = new genai_1.GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });
const getNested = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};
const templateString = (template, dataStore) => {
    const singleVarMatch = template.trim().match(/^\{\{\s*([\w\.]+)\s*\}\}$/);
    if (singleVarMatch) {
        const key = singleVarMatch[1];
        const value = getNested(dataStore, key);
        return value !== undefined ? value : template;
    }
    return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, key) => {
        const value = getNested(dataStore, key);
        if (value === undefined || value === null) {
            console.warn(`Template key "${key}" not found in data store.`);
            return match;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    });
};
const executeGeminiPrompt = (prompt, agentConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const model = (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.model) || 'gemini-2.5-flash';
    const response = yield ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.temperature,
            topK: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.topK,
            topP: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.topP,
            systemInstruction: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.systemInstruction) ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        },
    });
    return ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
});
const executeImageAnalysis = (prompt, imagePart, agentConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const model = (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.model) || 'gemini-2.5-flash';
    const textPart = { text: prompt };
    const response = yield ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [textPart, imagePart] }],
        config: {
            temperature: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.temperature,
            systemInstruction: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.systemInstruction) ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        },
    });
    return ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
});
const executeGroundedGeneration = (prompt, agentConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const model = (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.model) || 'gemini-2.5-flash';
    const response = yield ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.systemInstruction) ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
            temperature: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.temperature,
        }
    });
    const groundingChunks = ((_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.groundingMetadata) === null || _c === void 0 ? void 0 : _c.groundingChunks) || [];
    const sources = groundingChunks
        .map((chunk) => chunk.web)
        .filter((web) => web && web.uri);
    return {
        text: ((_h = (_g = (_f = (_e = (_d = response.candidates) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.parts) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.text) || "",
        sources: sources,
    };
});
const executeTextManipulation = (funcBody, inputs) => {
    try {
        const func = new Function('inputs', funcBody);
        return func(inputs);
    }
    catch (e) {
        throw new Error(`Error in custom function: ${e.message}`);
    }
};
/**
 * Performs topological sort on workflow tasks using Kahn's algorithm
 * @param tasks Array of tasks to sort
 * @returns Object containing sorted tasks and any error feedback
 */
const topologicalSort = (tasks) => {
    const feedback = [];
    // Create adjacency list and in-degree count
    const adjList = new Map();
    const inDegree = new Map();
    const taskMap = new Map();
    // Initialize all tasks
    for (const task of tasks) {
        taskMap.set(task.id, task);
        adjList.set(task.id, []);
        inDegree.set(task.id, 0);
    }
    // Build dependency graph
    for (const task of tasks) {
        for (const depId of task.dependencies) {
            if (!taskMap.has(depId)) {
                feedback.push(`Task "${task.name}" depends on non-existent task ID: ${depId}`);
                continue;
            }
            // Add edge from dependency to current task
            adjList.get(depId).push(task.id);
            inDegree.set(task.id, inDegree.get(task.id) + 1);
        }
    }
    // Kahn's algorithm
    const queue = [];
    const result = [];
    // Find all nodes with no incoming edges
    for (const [taskId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(taskId);
        }
    }
    while (queue.length > 0) {
        const currentId = queue.shift();
        const currentTask = taskMap.get(currentId);
        result.push(currentTask);
        // Remove this node from the graph
        for (const neighborId of adjList.get(currentId)) {
            inDegree.set(neighborId, inDegree.get(neighborId) - 1);
            if (inDegree.get(neighborId) === 0) {
                queue.push(neighborId);
            }
        }
    }
    // Check for cycles
    if (result.length !== tasks.length) {
        feedback.push('Cycle detected in task dependencies - workflow cannot be executed');
        return { sortedTasks: [], feedback };
    }
    return { sortedTasks: result, feedback };
};
/**
 * Resolves input dependencies and interpolates prompt templates
 * @param task The task to process
 * @param dataStore The current data store
 * @returns The interpolated prompt template and resolved inputs
 */
const resolveTaskInputs = (task, dataStore) => {
    const resolvedInputs = {};
    // Resolve inputs from data store using inputKeys
    for (const key of task.inputKeys) {
        const value = getNested(dataStore, key);
        if (value === undefined) {
            throw new Error(`Missing required input key "${key}" in data store for task "${task.name}"`);
        }
        // Use simple key for the resolved inputs (remove dot notation)
        const simpleKey = key.split('.').pop() || key;
        resolvedInputs[simpleKey] = value;
    }
    // If task has input mappings, resolve those as well
    if (task.inputs) {
        for (const [inputName, mapping] of Object.entries(task.inputs)) {
            const { nodeId, outputName } = mapping;
            // Look for the output in the data store
            const outputValue = dataStore[nodeId];
            if (outputValue === undefined) {
                throw new Error(`Task "${task.name}" depends on output from task "${nodeId}" which has not been executed`);
            }
            // If outputName is specified, get that specific property
            let resolvedValue = outputValue;
            if (outputName && outputName !== nodeId) {
                if (typeof outputValue === 'object' && outputValue !== null) {
                    resolvedValue = outputValue[outputName];
                    if (resolvedValue === undefined) {
                        throw new Error(`Task "${task.name}" expects output "${outputName}" from task "${nodeId}" but it was not found`);
                    }
                }
            }
            resolvedInputs[inputName] = resolvedValue;
        }
    }
    // Interpolate prompt template if present
    let interpolatedPrompt;
    if (task.promptTemplate) {
        interpolatedPrompt = templateString(task.promptTemplate, Object.assign(Object.assign({}, dataStore), resolvedInputs));
    }
    return { resolvedInputs, interpolatedPrompt };
};
class WorkflowExecutionService {
    executeTask(task, dataStore, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Resolve task inputs and interpolate templates
            const { resolvedInputs, interpolatedPrompt } = resolveTaskInputs(task, dataStore);
            switch (task.type) {
                case 'DATA_INPUT':
                    if (task.staticValue && typeof task.staticValue === 'string') {
                        return templateString(task.staticValue, dataStore);
                    }
                    return task.staticValue;
                case 'GEMINI_PROMPT': {
                    if (task.promptId) {
                        if (!prompt) {
                            throw new Error(`Task "${task.name}" requires prompt ID "${task.promptId}" but no prompt was provided.`);
                        }
                        const linkedPrompt = prompt;
                        const { sflTenor, sflMode } = linkedPrompt;
                        const instructionParts = [];
                        if (sflTenor.aiPersona)
                            instructionParts.push(`You will act as a ${sflTenor.aiPersona}.`);
                        if (sflTenor.desiredTone)
                            instructionParts.push(`Your tone should be ${sflTenor.desiredTone}.`);
                        if ((_a = sflTenor.targetAudience) === null || _a === void 0 ? void 0 : _a.length)
                            instructionParts.push(`You are writing for ${sflTenor.targetAudience.join(', ')}.`);
                        if (sflMode.textualDirectives)
                            instructionParts.push(`Follow these directives: ${sflMode.textualDirectives}.`);
                        const systemInstruction = instructionParts.join(' ');
                        // Use enhanced interpolation with resolved inputs
                        const finalPromptText = templateString(linkedPrompt.promptText, Object.assign(Object.assign({}, dataStore), resolvedInputs));
                        const finalAgentConfig = Object.assign(Object.assign({}, task.agentConfig), { systemInstruction });
                        return executeGeminiPrompt(finalPromptText, finalAgentConfig);
                    }
                    else {
                        if (!interpolatedPrompt)
                            throw new Error("Prompt template is missing for non-linked prompt task.");
                        return executeGeminiPrompt(interpolatedPrompt, task.agentConfig);
                    }
                }
                case 'GEMINI_GROUNDED':
                    if (!interpolatedPrompt)
                        throw new Error("Prompt template is missing.");
                    return executeGroundedGeneration(interpolatedPrompt, task.agentConfig);
                case 'IMAGE_ANALYSIS': {
                    if (!interpolatedPrompt)
                        throw new Error("Prompt template is missing.");
                    const imageInputKey = task.inputKeys[0];
                    if (!imageInputKey) {
                        throw new Error("IMAGE_ANALYSIS task must have at least one input key pointing to the image data.");
                    }
                    const imageData = resolvedInputs[imageInputKey.split('.').pop() || imageInputKey];
                    if (!imageData || typeof imageData.base64 !== 'string' || typeof imageData.type !== 'string') {
                        throw new Error(`Image data from key "${imageInputKey}" is missing, malformed, or not found in inputs.`);
                    }
                    const imagePart = {
                        inlineData: {
                            data: imageData.base64,
                            mimeType: imageData.type,
                        },
                    };
                    return executeImageAnalysis(interpolatedPrompt, imagePart, task.agentConfig);
                }
                case 'TEXT_MANIPULATION':
                    if (!task.functionBody)
                        throw new Error("Function body is missing.");
                    return executeTextManipulation(task.functionBody, resolvedInputs);
                default:
                    throw new Error(`Unsupported task type: ${task.type}`);
            }
        });
    }
    /**
     * Executes a complete workflow with proper dependency resolution
     * @param workflow The workflow to execute
     * @param userInput Initial user input
     * @param prompts Array of available prompts
     * @returns Execution results with data store and task results
     */
    executeWorkflow(workflow_1) {
        return __awaiter(this, arguments, void 0, function* (workflow, userInput = {}, prompts = []) {
            // Perform topological sort to determine execution order
            const { sortedTasks, feedback } = topologicalSort(workflow.tasks || []);
            if (sortedTasks.length === 0) {
                throw new Error('Cannot execute workflow: ' + feedback.join(', '));
            }
            // Initialize data store with user input
            const dataStore = { userInput };
            const results = {};
            // Execute tasks in topologically sorted order
            for (const task of sortedTasks) {
                try {
                    // Find linked prompt if task has one
                    const linkedPrompt = task.promptId
                        ? prompts.find(p => p.id === task.promptId)
                        : undefined;
                    // Execute the task
                    const result = yield this.executeTask(task, dataStore, linkedPrompt);
                    // Store result in data store for subsequent tasks
                    dataStore[task.outputKey] = result;
                    results[task.id] = result;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    throw new Error(`Task "${task.name}" failed: ${errorMessage}`);
                }
            }
            return { dataStore, results, feedback };
        });
    }
}
exports.default = new WorkflowExecutionService();
