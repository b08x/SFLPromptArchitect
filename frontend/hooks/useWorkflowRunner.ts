/**
 * @file useWorkflowRunner.ts
 * @description This custom hook encapsulates the logic for running a workflow.
 * It manages the state of the workflow execution, including the data store, the status of each task,
 * and whether the workflow is currently running. It provides functions to run and reset the workflow.
 *
 * @requires react
 * @requires ../types
 * @requires ../services/workflowEngine
 */

import { useState, useCallback } from 'react';
import { Workflow, DataStore, TaskStateMap, TaskStatus, Task, PromptSFL } from '../types';
import { topologicalSort, executeTask } from '../services/workflowEngine';

/**
 * A custom hook to manage the execution of a workflow.
 * It orchestrates the running of tasks in the correct topological order,
 * manages state transitions for each task, and handles the flow of data
 * through the workflow's `DataStore`.
 *
 * @param {Workflow | null} workflow - The workflow object to be executed. If null, the hook remains idle.
 * @param {PromptSFL[]} prompts - The library of available SFL prompts, used for tasks that reference them.
 * @returns {{
 *   dataStore: DataStore;
 *   taskStates: TaskStateMap;
 *   isRunning: boolean;
 *   run: (stagedUserInput?: Record<string, any>) => Promise<void>;
 *   reset: () => void;
 *   runFeedback: string[];
 * }} An object containing the state of the workflow run and functions to control it.
 *
 * @example
 * const { dataStore, taskStates, isRunning, run, reset } = useWorkflowRunner(myWorkflow, allPrompts);
 *
 * // To run the workflow:
 * <button onClick={() => run({ text: "Initial user text" })} disabled={isRunning}>
 *   {isRunning ? 'Running...' : 'Run Workflow'}
 * </button>
 *
 * // To reset the state:
 * <button onClick={reset}>Reset</button>
 *
 * // To display task status:
 * <div>
 *   {myWorkflow.tasks.map(task => (
 *     <p key={task.id}>
 *       {task.name}: {taskStates[task.id]?.status || 'PENDING'}
 *     </p>
 *   ))}
 * </div>
 */
export const useWorkflowRunner = (workflow: Workflow | null, prompts: PromptSFL[]) => {
    /**
     * @state
     * @description The central data repository for the workflow run.
     * It stores the outputs of all completed tasks, keyed by their `outputKey`.
     */
    const [dataStore, setDataStore] = useState<DataStore>({});
    
    /**
     * @state
     * @description A map from task IDs to their current execution state, including status, results, and errors.
     */
    const [taskStates, setTaskStates] = useState<TaskStateMap>({});
    
    /**
     * @state
     * @description A boolean flag indicating whether the workflow is currently executing.
     */
    const [isRunning, setIsRunning] = useState(false);
    
    /**
     * @state
     * @description An array of feedback messages generated during the workflow run, such as warnings about dependencies.
     */
    const [runFeedback, setRunFeedback] = useState<string[]>([]);
    
    /**
     * @function
     * @description Initializes or resets the state of all tasks in the workflow to PENDING.
     * Also clears the data store and any run feedback.
     * @param {Task[]} tasks - The array of tasks from the current workflow.
     */
    const initializeStates = useCallback((tasks: Task[]) => {
        const initialStates: TaskStateMap = {};
        for (const task of tasks) {
            initialStates[task.id] = { status: TaskStatus.PENDING };
        }
        setTaskStates(initialStates);
        setDataStore({});
        setRunFeedback([]);
    }, []);

    /**
     * @function
     * @description Resets the entire workflow execution state, setting all tasks to PENDING
     * and clearing the data store.
     */
    const reset = useCallback(() => {
        if (workflow) {
            initializeStates(workflow.tasks);
        } else {
            setTaskStates({});
            setDataStore({});
        }
        setIsRunning(false);
    }, [workflow, initializeStates]);

    /**
     * @function
     * @description Starts the execution of the workflow.
     * It performs a topological sort of the tasks, then executes them sequentially,
     * updating the task states and data store as it progresses.
     * @param {Record<string, any>} [stagedUserInput={}] - The initial input data provided by the user,
     * which is placed in `dataStore.userInput`.
     * @returns {Promise<void>} A promise that resolves when the workflow has finished running (either completed or failed).
     */
    const run = useCallback(async (stagedUserInput: Record<string, any> = {}) => {
        if (!workflow) {
            setRunFeedback(['No workflow selected.']);
            return;
        }
        
        setIsRunning(true);
        initializeStates(workflow.tasks);

        const { sortedTasks, feedback } = topologicalSort(workflow.tasks);
        setRunFeedback(feedback);

        if (feedback.some(f => f.includes('Cycle detected'))) {
            setIsRunning(false);
            return;
        }
        
        const initialDataStore: DataStore = { userInput: stagedUserInput };
        setDataStore(initialDataStore);

        for (const task of sortedTasks) {
            const hasSkippedDependency = task.dependencies.some(depId => taskStates[depId]?.status === TaskStatus.FAILED || taskStates[depId]?.status === TaskStatus.SKIPPED);
            
            if (hasSkippedDependency) {
                setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.SKIPPED, error: 'Skipped due to dependency failure.' }}));
                continue;
            }

            setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.RUNNING, startTime: Date.now() }}));
            
            try {
                const currentDataStore = await new Promise<DataStore>(resolve => setDataStore(current => { resolve(current); return current; }));
                const result = await executeTask(task, currentDataStore, prompts);

                setDataStore(prev => ({ ...prev, [task.outputKey]: result }));
                setTaskStates(prev => ({
                    ...prev, 
                    [task.id]: { ...prev[task.id], status: TaskStatus.COMPLETED, result, endTime: Date.now() }
                }));

            } catch (error: any) {
                console.error(`Error executing task ${task.name}:`, error);
                setTaskStates(prev => ({
                    ...prev,
                    [task.id]: { ...prev[task.id], status: TaskStatus.FAILED, error: error.message, endTime: Date.now() }
                }));
            }
        }
        
        setIsRunning(false);

    }, [workflow, initializeStates, taskStates, prompts]);

    return { dataStore, taskStates, isRunning, run, reset, runFeedback };
};
