import { Task, DataStore, PromptSFL } from '../types';

const API_BASE_URL = '/api/workflows';

const getNested = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

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

const executeTextManipulation = (funcBody: string, inputs: Record<string, any>): any => {
    try {
        const func = new Function('inputs', funcBody);
        return func(inputs);
    } catch (e: any) {
        throw new Error(`Error in custom function: ${e.message}`);
    }
};

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
        const response = await fetch(`${API_BASE_URL}/run-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task, dataStore }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to execute task "${task.name}"`);
        }
        return response.json();
    }
};

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
