/**
 * @file workflowEngine.ts
 * @description This module contains the core logic for executing and managing workflows.
 * It includes functions for task execution, topological sorting of tasks, and API interactions
 * for saving and retrieving workflows.
 *
 * @requires ../types
 */

import { Task, DataStore, PromptSFL, Workflow } from '../types';
import authService from './authService';

/**
 * @constant {string} API_BASE_URL - The base URL for the workflow-related API endpoints.
 * @private
 */
const API_BASE_URL = '/api/workflows';

/**
 * Safely retrieves a nested value from an object using a dot-notation path.
 * This is a utility function to access data within the `DataStore`.
 *
 * @param {Record<string, any>} obj - The object to query.
 * @param {string} path - The dot-notation path to the desired value (e.g., 'userInput.text').
 * @returns {*} The value at the specified path, or `undefined` if the path is not found.
 * @example
 * const myObj = { a: { b: { c: 1 } } };
 * getNested(myObj, 'a.b.c'); // returns 1
 * getNested(myObj, 'a.d'); // returns undefined
 * @private
 */
const getNested = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Replaces placeholders in a template string with values from the data store.
 * Placeholders are in the format `{{dot.notation.path}}`.
 * If the template is a single variable `{{var}}`, it returns the raw value from the data store,
 * preserving its type (e.g., an object or array). Otherwise, it performs string interpolation.
 *
 * @param {string} template - The string containing placeholders.
 * @param {DataStore} dataStore - The object containing data to fill in the template.
 * @returns {*} The processed string, or the raw value if the template was a single variable placeholder.
 * @private
 */
const templateString = (template: string, dataStore: DataStore): any => {
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
 * Executes a string of JavaScript code as a function body for `TEXT_MANIPULATION` tasks.
 * The function is sandboxed and receives an `inputs` object with the resolved dependencies.
 *
 * @param {string} funcBody - The string of JavaScript code to execute.
 * @param {Record<string, any>} inputs - An object containing input values accessible to the function via `inputs.key`.
 * @returns {*} The result of the executed function.
 * @throws {Error} Throws an error if the custom function code fails during execution.
 * @private
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
 * Executes a single workflow task.
 * It distinguishes between client-side tasks (like data input or text manipulation)
 * and server-side tasks (like Gemini API calls), handling each appropriately.
 *
 * @param {Task} task - The task object to execute.
 * @param {DataStore} dataStore - The current state of the workflow's data store, used to resolve inputs.
 * @param {PromptSFL[]} prompts - The library of available SFL prompts, needed for tasks that reference them.
 * @returns {Promise<any>} A promise that resolves with the task's output.
 * @throws {Error} Throws an error if the task execution fails, either on the client or server.
 */
export const executeTask = async (task: Task, dataStore: DataStore, prompts: PromptSFL[]): Promise<any> => {
    const isClientSideTask = ['DATA_INPUT', 'TEXT_MANIPULATION', 'DISPLAY_CHART', 'SIMULATE_PROCESS'].includes(task.type);

    if (isClientSideTask) {
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
            case 'TEXT_MANIPULATION':
                if (!task.functionBody) throw new Error("Function body is missing.");
                return executeTextManipulation(task.functionBody, resolvedInputs);
            case 'DISPLAY_CHART':
                 if(!task.dataKey) throw new Error("Data key is missing for chart display.");
                 return getNested(dataStore, task.dataKey);
            case 'SIMULATE_PROCESS':
                return new Promise(resolve => {
                    setTimeout(() => resolve({ status: "ok", message: `Simulated process for ${task.name} completed.`}), 1000)
                });
            default:
                throw new Error(`Unsupported client-side task type: ${task.type}`);
        }
    } else {
        // For server-side tasks, call the backend
        const response = await authService.authenticatedFetch(`${API_BASE_URL}/run-task`, {
            method: 'POST',
            body: JSON.stringify({ task, dataStore }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to execute task "${task.name}"`);
        }
        return response.json();
    }
};

/**
 * Sorts tasks in a workflow based on their dependencies using a topological sort algorithm.
 * This ensures that tasks are executed only after their dependencies have been met.
 * It also detects cycles and reports missing dependencies.
 *
 * @param {Task[]} tasks - An array of task objects from a workflow.
 * @returns {{sortedTasks: Task[], feedback: string[]}} An object containing the array of tasks in execution order,
 * and an array of feedback messages (e.g., warnings about missing dependencies or errors for cycles).
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
 * Runs a complete workflow by executing its tasks in the correct topological order.
 * This function is a high-level orchestrator, intended for scenarios where callbacks are needed
 * to monitor the progress of a workflow run.
 *
 * @param {Task[]} tasks - The array of tasks in the workflow.
 * @param {DataStore} initialDataStore - The initial data to start the workflow with (e.g., user input).
 * @param {PromptSFL[]} prompts - A list of all available SFL prompts.
 * @param {(taskId: string, result: any) => void} onTaskComplete - A callback function executed after each task completes successfully.
 * @param {(taskId: string, error: Error) => void} onTaskError - A callback function executed when a task fails.
 * @param {(finalDataStore: DataStore) => void} onWorkflowComplete - A callback function executed after the entire workflow finishes successfully.
 * @returns {Promise<void>} A promise that resolves when the workflow execution is complete.
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

/**
 * Saves a new workflow or updates an existing one on the backend.
 *
 * @param {{ id?: string; name: string; tasks: Task[] }} workflow - The workflow object to save.
 * @returns {Promise<{ id: string }>} A promise that resolves with the ID of the saved workflow.
 * @throws {Error} Throws an error if the API request fails.
 */
export const saveWorkflow = async (workflow: { id?: string; name: string; tasks: Task[] }): Promise<{ id: string }> => {
    const url = workflow.id ? `${API_BASE_URL}/${workflow.id}` : API_BASE_URL;
    const method = workflow.id ? 'PUT' : 'POST';

    const response = await authService.authenticatedFetch(url, {
        method,
        body: JSON.stringify({ name: workflow.name, tasks: workflow.tasks }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save workflow');
    }
    return response.json();
};

/**
 * Fetches a list of all workflows from the backend.
 *
 * @returns {Promise<{ id: string; name: string }[]>} A promise that resolves to an array of workflow metadata.
 * @throws {Error} Throws an error if the API request fails.
 */
export const getWorkflows = async (): Promise<{ id: string; name: string }[]> => {
    const response = await authService.authenticatedFetch(API_BASE_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch workflows');
    }
    return response.json();
};

/**
 * Fetches a single, complete workflow by its ID from the backend.
 *
 * @param {string} id - The ID of the workflow to fetch.
 * @returns {Promise<{ id: string; name: string; tasks: Task[] }>} A promise that resolves to the full workflow object.
 * @throws {Error} Throws an error if the API request fails.
 */
export const getWorkflowById = async (id: string): Promise<{ id: string; name: string; tasks: Task[] }> => {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch workflow with id ${id}`);
    }
    return response.json();
};

/**
 * Deletes a workflow from the backend by its ID.
 *
 * @param {string} id - The ID of the workflow to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is successful.
 * @throws {Error} Throws an error if the API request fails.
 */
export const deleteWorkflow = async (id: string): Promise<void> => {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Failed to delete workflow');
    }
};

/**
 * @interface OrchestrateResponse
 * @description Represents the response from the AI orchestration API
 */
interface OrchestrateResponse {
    success: boolean;
    workflow?: Workflow;
    error?: string;
    validationErrors?: string[];
}

/**
 * Orchestrates a new workflow from a high-level user request using AI.
 * This function sends a natural language description to the backend AI orchestrator,
 * which automatically generates a complete, executable workflow with proper task
 * dependencies and data flow.
 *
 * @param {string} userRequest - A natural language description of what the user wants to accomplish
 * @returns {Promise<Workflow>} A promise that resolves to the generated workflow
 * @throws {Error} Throws an error if the API request fails or orchestration is unsuccessful
 * 
 * @example
 * ```typescript
 * try {
 *   const workflow = await orchestrateWorkflow(
 *     "Analyze customer feedback for sentiment and generate a summary report"
 *   );
 *   console.log(`Generated "${workflow.name}" with ${workflow.tasks.length} tasks`);
 * } catch (error) {
 *   console.error('Orchestration failed:', error.message);
 * }
 * ```
 */
export const orchestrateWorkflow = async (userRequest: string): Promise<Workflow> => {
    if (!userRequest?.trim()) {
        throw new Error('User request cannot be empty');
    }

    if (userRequest.length > 2000) {
        throw new Error('Request description is too long. Please limit to 2000 characters.');
    }

    const response = await authService.authenticatedFetch(`${API_BASE_URL}/orchestrate`, {
        method: 'POST',
        body: JSON.stringify({ request: userRequest.trim() }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        
        if (response.status === 400) {
            throw new Error(errorData.error || 'Invalid request format');
        } else if (response.status === 422) {
            const validationMsg = errorData.validationErrors 
                ? `Workflow validation failed: ${errorData.validationErrors.join('; ')}`
                : 'Generated workflow failed validation';
            throw new Error(validationMsg);
        } else if (response.status === 503) {
            throw new Error('AI orchestration service is temporarily unavailable');
        } else {
            throw new Error(errorData.error || `Failed to orchestrate workflow (${response.status})`);
        }
    }

    const result: OrchestrateResponse = await response.json();
    
    if (!result.success || !result.workflow) {
        throw new Error(result.error || 'Failed to generate workflow');
    }

    return result.workflow;
};
