import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Task, DataStore, AgentConfig, PromptSFL } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

/**
 * Safely retrieves a nested property from an object using a dot-notation string path.
 * @param {Record<string, any>} obj - The object to query.
 * @param {string} path - The dot-notation path to the desired property (e.g., "user.address.city").
 * @returns {any} The value at the specified path, or undefined if not found.
 */
const getNested = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Replaces placeholders in a template string with values from the data store.
 * If the template is a single variable placeholder (e.g., "{{data.image}}"), it returns the raw value.
 * Otherwise, it performs string interpolation.
 * @param {string} template - The template string with {{key}} placeholders.
 * @param {DataStore} dataStore - The object containing data to fill in the template.
 * @returns {any} The processed template, which can be a string, object, or other data type.
 */
export const templateString = (template: string, dataStore: DataStore): any => {
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

/**
 * Executes a prompt using the Gemini API.
 * @param {string} prompt - The prompt text to send to the model.
 * @param {AgentConfig} [agentConfig] - Optional configuration for the AI agent (model, temperature, etc.).
 * @returns {Promise<string>} The text response from the model.
 */
const executeGeminiPrompt = async (prompt: string, agentConfig?: AgentConfig): Promise<string> => {
    const model = agentConfig?.model || 'gemini-2.0-flash';
    const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: agentConfig?.temperature,
            topK: agentConfig?.topK,
            topP: agentConfig?.topP,
        },
        systemInstruction: agentConfig?.systemInstruction ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

/**
 * Executes an image analysis prompt using the Gemini API.
 * @param {string} prompt - The text prompt to accompany the image.
 * @param {Part} imagePart - The image data, formatted as a GenAI `Part` object.
 * @param {AgentConfig} [agentConfig] - Optional configuration for the AI agent.
 * @returns {Promise<string>} The text response from the model.
 */
const executeImageAnalysis = async (prompt: string, imagePart: Part, agentConfig?: AgentConfig): Promise<string> => {
    const model = agentConfig?.model || 'gemini-2.0-flash';
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [textPart, imagePart] }],
        generationConfig: {
            temperature: agentConfig?.temperature,
        },
        systemInstruction: agentConfig?.systemInstruction ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

/**
 * Executes a prompt that is grounded with Google Search results.
 * @param {string} prompt - The prompt text to send.
 * @param {AgentConfig} [agentConfig] - Optional configuration for the AI agent.
 * @returns {Promise<{text: string, sources: any[]}>} An object containing the model's text response and an array of sources.
 */
const executeGroundedGeneration = async (prompt: string, agentConfig?: AgentConfig): Promise<{ text: string, sources: any[] }> => {
    const model = agentConfig?.model || 'gemini-2.0-flash';
    const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        systemInstruction: agentConfig?.systemInstruction ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        generationConfig: {
            temperature: agentConfig?.temperature,
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingAttributions || [];
    const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri);

    return {
        text: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
        sources: sources,
    };
};

/**
 * Executes a custom JavaScript function body.
 * @param {string} funcBody - The body of the function as a string.
 * @param {Record<string, any>} inputs - An object containing the inputs for the function.
 * @returns {any} The return value of the executed function.
 * @throws {Error} If there is an error in the custom function's execution.
 */
const executeTextManipulation = (funcBody: string, inputs: Record<string, any>): any => {
    try {
        const func = new Function('inputs', funcBody);
        return func(inputs);
    } catch (e: any) {
        throw new Error(`Error in custom function: ${e.message}`);
    }
};

/**
 * Executes a single task within a workflow.
 * @param {Task} task - The task object to execute.
 * @param {DataStore} dataStore - The current state of the workflow's data.
 * @param {PromptSFL[]} prompts - A library of available SFL prompts.
 * @returns {Promise<any>} A promise that resolves with the result of the task.
 * @throws {Error} If a required input is missing, a linked prompt is not found, or the task type is unsupported.
 */
export const executeTask = async (task: Task, dataStore: DataStore, prompts: PromptSFL[]): Promise<any> => {
    const inputs: Record<string, any> = {};
    for (const key of task.inputKeys) {
        inputs[key] = getNested(dataStore, key);
        if (inputs[key] === undefined) {
             throw new Error(`Missing required input key "${key}" in data store for task "${task.name}".`);
        }
    }
    
    const resolvedInputs = task.inputKeys.reduce((acc, key) => {
        const simpleKey = key.split('.').pop() || key;
        acc[simpleKey] = getNested(dataStore, key);
        return acc;
    }, {} as Record<string, any>);


    switch (task.type) {
        case 'DATA_INPUT':
            if (task.staticValue && typeof task.staticValue === 'string') {
                return templateString(task.staticValue, dataStore);
            }
            return task.staticValue;

        case 'GEMINI_PROMPT': {
            if (task.promptId) {
                const linkedPrompt = prompts.find(p => p.id === task.promptId);
                if (!linkedPrompt) {
                    throw new Error(`Task "${task.name}" has a linked prompt with ID "${task.promptId}" that was not found in the library.`);
                }
                
                const { sflTenor, sflMode } = linkedPrompt;
                
                const instructionParts = [];
                if (sflTenor.aiPersona) instructionParts.push(`You will act as a ${sflTenor.aiPersona}.`);
                if (sflTenor.desiredTone) instructionParts.push(`Your tone should be ${sflTenor.desiredTone}.`);
                if (sflTenor.targetAudience?.length) instructionParts.push(`You are writing for ${sflTenor.targetAudience.join(', ')}.`);
                if (sflMode.textualDirectives) instructionParts.push(`Follow these directives: ${sflMode.textualDirectives}.`);
                
                const systemInstruction = instructionParts.join(' ');
                
                const finalPromptText = templateString(linkedPrompt.promptText, dataStore);
                const finalAgentConfig = { ...task.agentConfig, systemInstruction };
                
                return executeGeminiPrompt(finalPromptText, finalAgentConfig);

            } else {
                 if (!task.promptTemplate) throw new Error("Prompt template is missing for non-linked prompt task.");
                const finalPrompt = templateString(task.promptTemplate, dataStore);
                return executeGeminiPrompt(finalPrompt, task.agentConfig);
            }
        }
        
        case 'GEMINI_GROUNDED':
            if (!task.promptTemplate) throw new Error("Prompt template is missing.");
            const groundedPrompt = templateString(task.promptTemplate, dataStore);
            return executeGroundedGeneration(groundedPrompt, task.agentConfig);

        case 'IMAGE_ANALYSIS': {
            if (!task.promptTemplate) throw new Error("Prompt template is missing.");

            const imageInputKey = task.inputKeys[0];
            if (!imageInputKey) {
                throw new Error("IMAGE_ANALYSIS task must have at least one input key pointing to the image data.");
            }
            
            const imageData = inputs[imageInputKey];
            if (!imageData || typeof imageData.base64 !== 'string' || typeof imageData.type !== 'string') {
                throw new Error(`Image data from key "${imageInputKey}" is missing, malformed, or not found in inputs.`);
            }

            const imagePart: Part = {
                inlineData: {
                    data: imageData.base64,
                    mimeType: imageData.type,
                },
            };

            const analysisPrompt = templateString(task.promptTemplate, dataStore);
            return executeImageAnalysis(analysisPrompt, imagePart, task.agentConfig);
        }

        case 'TEXT_MANIPULATION':
            if (!task.functionBody) throw new Error("Function body is missing.");
            return executeTextManipulation(task.functionBody, resolvedInputs);

        case 'SIMULATE_PROCESS':
            return new Promise(resolve => {
                setTimeout(() => resolve({ status: "ok", message: `Simulated process for ${task.name} completed.`}), 1000)
            });
        
        case 'DISPLAY_CHART':
             if(!task.dataKey) throw new Error("Data key is missing for chart display.");
             return getNested(dataStore, task.dataKey);

        default:
            throw new Error(`Unsupported task type: ${task.type}`);
    }
};

/**
 * Sorts tasks in a workflow topologically based on their dependencies.
 * @param {Task[]} tasks - The array of tasks to sort.
 * @returns {{sortedTasks: Task[], feedback: string[]}} An object containing the sorted tasks and any feedback (e.g., warnings about cycles or missing dependencies).
 */
export const topologicalSort = (tasks: Task[]): { sortedTasks: Task[], feedback: string[] } => {
    const sortedTasks: Task[] = [];
    const feedback: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    function visit(taskId: string) {
        if (recursionStack.has(taskId)) {
            feedback.push(`Cycle detected in workflow involving task ID: ${taskId}`);
            return;
        }
        if (visited.has(taskId)) {
            return;
        }

        visited.add(taskId);
        recursionStack.add(taskId);

        const task = taskMap.get(taskId);
        if (task) {
            for (const depId of task.dependencies) {
                if (taskMap.has(depId)) {
                    visit(depId);
                } else {
                    feedback.push(`Warning: Task "${task.name}" has an unknown dependency: "${depId}". It will be ignored.`);
                }
            }
            sortedTasks.push(task);
        }
        
        recursionStack.delete(taskId);
    }

    for (const task of tasks) {
        if (!visited.has(task.id)) {
            visit(task.id);
        }
    }
    
    if(feedback.some(f => f.includes('Cycle detected'))) {
       return { sortedTasks: [], feedback };
    }

    return { sortedTasks, feedback };
};

/**
 * Runs a complete workflow from start to finish.
 * @param {Task[]} tasks - The list of tasks in the workflow.
 * @param {DataStore} initialDataStore - The initial data for the workflow run.
 * @param {PromptSFL[]} prompts - The library of available SFL prompts.
 * @param {(taskId: string, result: any) => void} onTaskComplete - Callback function executed when a task completes successfully.
 * @param {(taskId: string, error: Error) => void} onTaskError - Callback function executed when a task fails.
 * @param {(finalDataStore: DataStore) => void} onWorkflowComplete - Callback function executed when the entire workflow finishes.
 */
export const runWorkflow = async (
    tasks: Task[],
    initialDataStore: DataStore,
    prompts: PromptSFL[],
    onTaskComplete: (taskId: string, result: any) => void,
    onTaskError: (taskId: string, error: Error) => void,
    onWorkflowComplete: (finalDataStore: DataStore) => void
) => {
    const { sortedTasks, feedback } = topologicalSort(tasks);
    
    if (feedback.some(f => f.includes('Cycle detected'))) {
        const cycleError = new Error(feedback.find(f => f.includes('Cycle detected')));
        console.error("Workflow has a cycle, cannot run.", cycleError.message);
        onTaskError("workflow-validation", cycleError);
        return;
    }
    if (feedback.length > 0) {
        console.warn("Workflow validation warnings:", feedback);
    }

    const dataStore: DataStore = { ...initialDataStore };

    for (const task of sortedTasks) {
        try {
            const result = await executeTask(task, dataStore, prompts);
            dataStore[task.outputKey] = result;
            onTaskComplete(task.id, result);
        } catch (error: any) {
            console.error(`Error executing task ${task.name} (${task.id}):`, error);
            onTaskError(task.id, error);
            return;
        }
    }

    onWorkflowComplete(dataStore);
};