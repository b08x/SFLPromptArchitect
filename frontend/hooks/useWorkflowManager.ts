/**
 * @file useWorkflowManager.ts
 * @description This custom hook manages the state and persistence of workflows.
 * It handles loading default and custom workflows, saving changes to local storage,
 * and providing functions to add, update, and delete custom workflows.
 *
 * @requires react
 * @requires ../types
 * @requires ../constants
 * @since 0.5.1
 */

import { useState, useEffect, useCallback } from 'react';
import { Workflow } from '../types';

/**
 * @constant {string} LOCAL_STORAGE_KEY - The key used to store and retrieve custom workflows from the browser's local storage.
 * @private
 */
const LOCAL_STORAGE_KEY = 'sfl-custom-workflows';

/**
 * A custom hook to manage the state of both default and custom workflows.
 * It initializes the state by loading default workflows from constants and custom workflows
 * from local storage. It provides a set of memoized functions to interact with the
 * custom workflows, ensuring that any changes are persisted.
 *
 * @returns {{
 *   workflows: Workflow[];
 *   saveWorkflow: (workflow: Workflow) => void;
 *   deleteWorkflow: (id: string) => void;
 *   isLoading: boolean;
 *   saveCustomWorkflows: (workflows: Workflow[]) => void;
 * }} An object containing the list of all workflows, loading state, and functions to manage them.
 *
 * @example
 * const { workflows, saveWorkflow, deleteWorkflow, isLoading } = useWorkflowManager();
 *
 * if (isLoading) {
 *   return <p>Loading workflows...</p>;
 * }
 *
 * return (
 *   <WorkflowList
 *     workflows={workflows}
 *     onSave={saveWorkflow}
 *     onDelete={deleteWorkflow}
 *   />
 * );
 */
export const useWorkflowManager = () => {
    /**
     * @state
     * @description The combined list of default and custom workflows.
     */
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    
    /**
     * @state
     * @description A boolean flag indicating if the initial load of workflows from local storage is in progress.
     */
    const [isLoading, setIsLoading] = useState(true);

    /**
     * @effect
     * @description On initial mount, this effect loads the default workflows from JSON file and any custom workflows
     * saved in local storage. It handles potential parsing errors by clearing the invalid
     * local storage entry and falling back to just the default workflows.
     */
    useEffect(() => {
        const loadWorkflows = async () => {
            try {
                // Load default workflows from JSON file
                const defaultResponse = await fetch('/default-workflows.json');
                const defaultWorkflows = await defaultResponse.json();
                
                // Load custom workflows from localStorage
                const savedWorkflowsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                const savedWorkflows = savedWorkflowsRaw ? JSON.parse(savedWorkflowsRaw) : [];
                
                if (!Array.isArray(savedWorkflows)) {
                     throw new Error("Invalid data in localStorage");
                }

                const defaultWfs = defaultWorkflows.map(wf => ({ ...wf, isDefault: true }));
                const customWfs = savedWorkflows.map(wf => ({...wf, isDefault: false }));

                setWorkflows([...defaultWfs, ...customWfs]);

            } catch (error) {
                console.error("Failed to load workflows:", error);
                // Fallback to empty defaults if JSON load fails
                setWorkflows([]);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadWorkflows();
    }, []);

    /**
     * @function
     * @description Saves an array of custom workflows to local storage and updates the component state.
     * @param {Workflow[]} customWorkflows - The array of custom workflows to persist.
     */
    const saveCustomWorkflows = useCallback((customWorkflows: Workflow[]) => {
        try {
            const workflowsToSave = customWorkflows.filter(wf => !wf.isDefault);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workflowsToSave));
            
            // Update state by combining current default workflows with new custom ones
            setWorkflows(prevWorkflows => {
                const defaultWfs = prevWorkflows.filter(wf => wf.isDefault);
                return [
                    ...defaultWfs,
                    ...workflowsToSave.map(wf => ({...wf, isDefault: false}))
                ];
            });
        } catch (error) {
            console.error("Failed to save workflows to localStorage:", error);
        }
    }, []);

    /**
     * @function
     * @description Adds a new custom workflow or updates an existing one.
     * It ensures the `isDefault` flag is set to `false` and then persists the changes.
     * @param {Workflow} workflowToSave - The workflow object to save.
     */
    const saveWorkflow = useCallback((workflowToSave: Workflow) => {
        setWorkflows(prevWorkflows => {
            const newWorkflow = { ...workflowToSave, isDefault: false };
            const existingIndex = prevWorkflows.findIndex(wf => wf.id === newWorkflow.id && !wf.isDefault);
            
            let updatedCustomWorkflows;
            if (existingIndex > -1) {
                updatedCustomWorkflows = prevWorkflows.filter(wf => !wf.isDefault).map(wf => wf.id === newWorkflow.id ? newWorkflow : wf);
            } else {
                updatedCustomWorkflows = [...prevWorkflows.filter(wf => !wf.isDefault), newWorkflow];
            }
            
            saveCustomWorkflows(updatedCustomWorkflows);
            return [
                ...prevWorkflows.filter(wf => wf.isDefault),
                ...updatedCustomWorkflows
            ];
        });
    }, [saveCustomWorkflows]);
    
    /**
     * @function
     * @description Deletes a custom workflow by its ID. Default workflows cannot be deleted.
     * @param {string} workflowId - The ID of the custom workflow to delete.
     */
    const deleteWorkflow = useCallback((workflowId: string) => {
        setWorkflows(prevWorkflows => {
            const updatedCustomWorkflows = prevWorkflows.filter(wf => wf.id !== workflowId && !wf.isDefault);
            saveCustomWorkflows(updatedCustomWorkflows);
            return [
                ...prevWorkflows.filter(wf => wf.isDefault),
                ...updatedCustomWorkflows
            ];
        });
    }, [saveCustomWorkflows]);

    return { workflows, saveWorkflow, deleteWorkflow, isLoading, saveCustomWorkflows };
};
