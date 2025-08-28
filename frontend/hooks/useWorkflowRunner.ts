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

import { useState, useCallback, useRef, useEffect } from 'react';
import { Workflow, DataStore, TaskStateMap, TaskStatus, Task, PromptSFL, WorkflowExecution, ActiveProviderConfig } from '../types';
import { topologicalSort, executeTask } from '../services/workflowEngine';
import authService from '../services/authService';

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
export const useWorkflowRunner = (
  workflow: Workflow | null, 
  prompts: PromptSFL[], 
  providerConfig: ActiveProviderConfig
) => {
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
     * @state
     * @description Current workflow execution information when running asynchronously
     */
    const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);

    /**
     * @state
     * @description Execution mode - 'local' for client-side execution, 'async' for server-side async execution
     */
    const [executionMode, setExecutionMode] = useState<'local' | 'async'>('local');

    /**
     * @ref
     * @description WebSocket connection for real-time updates
     */
    const wsRef = useRef<WebSocket | null>(null);

    /**
     * @ref
     * @description Cancellation token for stopping workflow execution
     */
    const cancellationRef = useRef<{ cancelled: boolean }>({ cancelled: false });

    /**
     * @function
     * @description Connects to WebSocket for real-time updates
     */
    const connectWebSocket = useCallback((jobId: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }

        const wsUrl = `ws://localhost:4000/ws`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
            // Subscribe to job updates
            wsRef.current?.send(JSON.stringify({
                type: 'subscribe',
                jobId: jobId
            }));
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, []);

    /**
     * @function
     * @description Handles incoming WebSocket messages
     */
    const handleWebSocketMessage = useCallback((message: any) => {
        switch (message.type) {
            case 'workflow_progress':
                if (message.status === 'running') {
                    setIsRunning(true);
                }
                break;
            
            case 'task_status':
                if (message.taskId) {
                    setTaskStates(prev => ({
                        ...prev,
                        [message.taskId]: {
                            status: message.status === 'active' ? TaskStatus.RUNNING :
                                   message.status === 'completed' ? TaskStatus.COMPLETED :
                                   message.status === 'failed' ? TaskStatus.FAILED :
                                   TaskStatus.PENDING,
                            result: message.result,
                            error: message.error,
                            startTime: message.status === 'active' ? Date.now() : prev[message.taskId]?.startTime,
                            endTime: message.status === 'completed' || message.status === 'failed' ? Date.now() : undefined,
                        }
                    }));

                    // Update data store if task completed
                    if (message.status === 'completed' && message.result !== undefined) {
                        setDataStore(prev => {
                            const task = workflow?.tasks.find(t => t.id === message.taskId);
                            if (task) {
                                return { ...prev, [task.outputKey]: message.result };
                            }
                            return prev;
                        });
                    }
                }
                break;
            
            case 'workflow_complete':
                setIsRunning(false);
                if (message.result?.dataStore) {
                    setDataStore(message.result.dataStore);
                }
                break;
            
            case 'workflow_failed':
                setIsRunning(false);
                setRunFeedback(prev => [...prev, `Workflow failed: ${message.error}`]);
                break;
            
            case 'workflow_stopped':
                setIsRunning(false);
                setRunFeedback(prev => [...prev, `Workflow stopped: ${message.reason || 'User cancelled'}`]);
                break;
        }
    }, [workflow]);

    /**
     * @function
     * @description Disconnects WebSocket
     */
    const disconnectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    /**
     * @function
     * @description Cleanup WebSocket on unmount
     */
    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, [disconnectWebSocket]);
    
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
     * @description Stops the currently running workflow execution
     */
    const stop = useCallback(async () => {
        if (!isRunning) return;
        
        // Set cancellation flag for local execution
        cancellationRef.current.cancelled = true;
        
        // For async execution, send stop request to backend
        if (executionMode === 'async' && currentExecution?.jobId) {
            try {
                await authService.authenticatedFetch(`/api/workflows/stop/${currentExecution.jobId}`, {
                    method: 'POST',
                });
            } catch (error) {
                console.error('Failed to send stop request:', error);
                setRunFeedback(prev => [...prev, 'Failed to send stop request to server']);
            }
        }
        
        // Update UI state immediately for better user experience
        setIsRunning(false);
        setRunFeedback(prev => [...prev, 'Stop requested...']);
    }, [isRunning, executionMode, currentExecution]);

    /**
     * @function
     * @description Resets the entire workflow execution state, setting all tasks to PENDING
     * and clearing the data store.
     */
    const reset = useCallback(() => {
        // Reset cancellation flag
        cancellationRef.current.cancelled = false;
        
        disconnectWebSocket();
        setCurrentExecution(null);
        
        if (workflow) {
            initializeStates(workflow.tasks);
        } else {
            setTaskStates({});
            setDataStore({});
        }
        setIsRunning(false);
    }, [workflow, initializeStates, disconnectWebSocket]);

    /**
     * @function
     * @description Executes workflow asynchronously on the server
     */
    const runAsync = useCallback(async (stagedUserInput: Record<string, any> = {}) => {
        if (!workflow) {
            setRunFeedback(['No workflow selected.']);
            return;
        }

        try {
            setIsRunning(true);
            initializeStates(workflow.tasks);

            // Send workflow to backend for async execution
            const response = await authService.authenticatedFetch('/api/workflows/execute', {
                method: 'POST',
                body: JSON.stringify({
                    workflow,
                    userInput: stagedUserInput,
                    providerConfig,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.jobId) {
                // Connect to WebSocket for real-time updates
                connectWebSocket(result.jobId);
                
                setCurrentExecution({
                    id: result.jobId,
                    workflowId: workflow.id,
                    jobId: result.jobId,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }

        } catch (error: any) {
            console.error('Failed to start async workflow execution:', error);
            setRunFeedback([`Failed to start execution: ${error.message}`]);
            setIsRunning(false);
        }
    }, [workflow, initializeStates, connectWebSocket, providerConfig]);

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
        if (executionMode === 'async') {
            return runAsync(stagedUserInput);
        }

        // Local execution (original logic)
        if (!workflow) {
            setRunFeedback(['No workflow selected.']);
            return;
        }
        
        // Reset cancellation flag and start execution
        cancellationRef.current.cancelled = false;
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
            // Check for cancellation before processing each task
            if (cancellationRef.current.cancelled) {
                setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.SKIPPED, error: 'Workflow cancelled by user.' }}));
                setRunFeedback(prev => [...prev, 'Workflow execution cancelled by user']);
                setIsRunning(false);
                return;
            }

            const hasSkippedDependency = task.dependencies.some(depId => taskStates[depId]?.status === TaskStatus.FAILED || taskStates[depId]?.status === TaskStatus.SKIPPED);
            
            if (hasSkippedDependency) {
                setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.SKIPPED, error: 'Skipped due to dependency failure.' }}));
                continue;
            }

            setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.RUNNING, startTime: Date.now() }}));
            
            try {
                const currentDataStore = await new Promise<DataStore>(resolve => setDataStore(current => { resolve(current); return current; }));
                const result = await executeTask(task, currentDataStore, prompts, providerConfig);

                // Check for cancellation after task execution
                if (cancellationRef.current.cancelled) {
                    setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.SKIPPED, error: 'Workflow cancelled by user.', endTime: Date.now() }}));
                    setRunFeedback(prev => [...prev, 'Workflow execution cancelled by user']);
                    setIsRunning(false);
                    return;
                }

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

    }, [workflow, initializeStates, taskStates, prompts, executionMode, runAsync]);

    return { 
        dataStore, 
        taskStates, 
        isRunning, 
        run, 
        stop, 
        reset, 
        runFeedback,
        currentExecution,
        executionMode,
        setExecutionMode,
    };
};
