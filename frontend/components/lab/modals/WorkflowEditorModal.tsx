/**
 * @file WorkflowEditorModal.tsx
 * @description This component provides a modal interface for creating and editing workflows.
 * It allows users to define the workflow's name and description, and to add, configure, and remove individual tasks.
 *
 * @requires react
 * @requires ../../../types
 * @requires ../../../utils/generateId
 * @requires ../../ModalShell
 * @requires ../../icons/PlusIcon
 * @requires ../../icons/TrashIcon
 * @requires ../../icons/LinkIcon
 */

import React, { useState, useEffect } from 'react';
import { Workflow, Task, TaskType, PromptSFL } from '../../../types';
import { generateId } from '../../../utils/generateId';
import ModalShell from '../../ModalShell';
import PlusIcon from '../../icons/PlusIcon';
import TrashIcon from '../../icons/TrashIcon';
import LinkIcon from '../../icons/LinkIcon';

/**
 * @interface WorkflowEditorModalProps
 * @description Defines the props for the WorkflowEditorModal component.
 * @property {boolean} isOpen - Whether the modal is currently open.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {(workflow: Workflow) => void} onSave - Callback function to save the workflow.
 * @property {Workflow | null} workflowToEdit - The workflow to be edited. If null, a new workflow is created.
 * @property {PromptSFL[]} prompts - The library of available SFL prompts for linking to tasks.
 */
interface WorkflowEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workflow: Workflow) => void;
    workflowToEdit: Workflow | null;
    prompts: PromptSFL[];
}

const emptyTask: Omit<Task, 'id'> = {
    name: 'New Task',
    description: '',
    type: TaskType.GEMINI_PROMPT,
    dependencies: [],
    inputKeys: [],
    outputKey: 'newResult',
    promptTemplate: '',
    agentConfig: { model: 'gemini-2.5-flash', temperature: 0.7 },
    functionBody: '',
    staticValue: '',
    dataKey: '',
};

/**
 * A sub-component within the editor for configuring a single task.
 * @param {object} props - The component props.
 * @returns {JSX.Element} A form section for editing a task.
 */
const TaskEditor: React.FC<{
    task: Task;
    updateTask: (updatedTask: Task) => void;
    removeTask: () => void;
    availableDependencies: { id: string; name: string }[];
    prompts: PromptSFL[];
}> = ({ task, updateTask, removeTask, availableDependencies, prompts }) => {

    const linkedPrompt = task.promptId ? prompts.find(p => p.id === task.promptId) : null;

    const handleChange = (field: keyof Task, value: any) => {
        updateTask({ ...task, [field]: value });
    };

    const handleDependencyChange = (depId: string) => {
        const newDeps = task.dependencies.includes(depId)
            ? task.dependencies.filter(d => d !== depId)
            : [...task.dependencies, depId];
        handleChange('dependencies', newDeps);
    };

    const handlePromptLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const promptId = e.target.value;
        handleChange('promptId', promptId || undefined);
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A69E2] focus:border-[#4A69E2]";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <details className="border border-gray-300 rounded-lg p-4 bg-white" open>
            <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span>{task.name}</span>
                    {task.promptId && <LinkIcon className="w-4 h-4 text-gray-400" />}
                </div>
                <button type="button" onClick={removeTask} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
            </summary>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClasses}>Name</label><input type="text" value={task.name} onChange={e => handleChange('name', e.target.value)} className={commonInputClasses} /></div>
                    <div><label className={labelClasses}>Type</label>
                        <select value={task.type} onChange={e => handleChange('type', e.target.value as TaskType)} className={commonInputClasses}>
                            {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div><label className={labelClasses}>Description</label><input type="text" value={task.description} onChange={e => handleChange('description', e.target.value)} className={commonInputClasses} /></div>

                <div>
                    <h4 className={labelClasses}>Dependencies</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                        {availableDependencies.map(dep => (
                            <div key={dep.id} className="flex items-center">
                                <input type="checkbox" id={`dep-${task.id}-${dep.id}`} checked={task.dependencies.includes(dep.id)} onChange={() => handleDependencyChange(dep.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                <label htmlFor={`dep-${task.id}-${dep.id}`} className="ml-2 text-sm text-gray-700 truncate">{dep.name}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClasses}>Input Keys (comma-separated)</label><input type="text" value={task.inputKeys.join(',')} onChange={e => handleChange('inputKeys', e.target.value.split(',').map(k => k.trim()))} className={commonInputClasses} /></div>
                    <div><label className={labelClasses}>Output Key</label><input type="text" value={task.outputKey} onChange={e => handleChange('outputKey', e.target.value)} className={commonInputClasses} /></div>
                </div>

                {task.type === TaskType.GEMINI_PROMPT && (
                    <div className="p-3 border border-dashed border-gray-300 rounded-md space-y-3 bg-gray-50/50">
                        <div>
                            <label className={labelClasses}>Link Library Prompt</label>
                            <select value={task.promptId || ''} onChange={handlePromptLinkChange} className={commonInputClasses}>
                                <option value="">-- None (Manual Prompt) --</option>
                                {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Prompt Template</label>
                            <textarea 
                                value={linkedPrompt ? linkedPrompt.promptText : (task.promptTemplate || '')} 
                                onChange={e => handleChange('promptTemplate', e.target.value)} 
                                rows={4} 
                                className={`${commonInputClasses} font-mono text-sm`}
                                disabled={!!linkedPrompt}
                                placeholder={linkedPrompt ? 'This is managed by the linked prompt.' : 'Enter prompt template here...'}
                            />
                        </div>
                         {!linkedPrompt && (
                            <div>
                                <label className={labelClasses}>Agent Config (JSON)</label>
                                <textarea
                                    value={task.agentConfig ? JSON.stringify(task.agentConfig, null, 2) : ''}
                                    onChange={e => {
                                        try { handleChange('agentConfig', JSON.parse(e.target.value)) } catch {}
                                    }}
                                    rows={4}
                                    className={`${commonInputClasses} font-mono text-sm`}
                                    placeholder='{ "temperature": 0.5 }'
                                />
                            </div>
                        )}
                    </div>
                )}
                
                {(task.type === TaskType.GEMINI_GROUNDED || task.type === TaskType.IMAGE_ANALYSIS) && (
                    <div><label className={labelClasses}>Prompt Template</label><textarea value={task.promptTemplate} onChange={e => handleChange('promptTemplate', e.target.value)} rows={4} className={`${commonInputClasses} font-mono text-sm`}></textarea></div>
                )}
                
                {task.type === TaskType.TEXT_MANIPULATION && (
                     <div><label className={labelClasses}>Function Body</label><textarea value={task.functionBody} onChange={e => handleChange('functionBody', e.target.value)} rows={4} className={`${commonInputClasses} font-mono text-sm`} placeholder="e.g., return `Hello, ${inputs.name}`"></textarea></div>
                )}
                
                {task.type === TaskType.DATA_INPUT && (
                    <div><label className={labelClasses}>Static Value</label><textarea value={task.staticValue} onChange={e => handleChange('staticValue', e.target.value)} rows={2} className={commonInputClasses}></textarea></div>
                )}
                
                {task.type === TaskType.DISPLAY_CHART && (
                    <div><label className={labelClasses}>Data Key for Chart</label><input type="text" value={task.dataKey} onChange={e => handleChange('dataKey', e.target.value)} className={commonInputClasses} /></div>
                )}
            </div>
        </details>
    );
};

/**
 * A modal for creating a new workflow or editing an existing one.
 *
 * @param {WorkflowEditorModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal editor or null if not open.
 */
const WorkflowEditorModal: React.FC<WorkflowEditorModalProps> = ({ isOpen, onClose, onSave, workflowToEdit, prompts }) => {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    useEffect(() => {
        if (workflowToEdit) {
            if(workflowToEdit.isDefault) {
                setWorkflow({
                    ...workflowToEdit,
                    id: `wf-custom-${generateId().slice(0, 8)}`,
                    name: `${workflowToEdit.name} (Copy)`,
                    isDefault: false,
                });
            } else {
                setWorkflow(JSON.parse(JSON.stringify(workflowToEdit)));
            }
        } else {
            setWorkflow({
                id: `wf-custom-${generateId().slice(0, 8)}`,
                name: 'New Custom Workflow',
                description: '',
                tasks: [],
            });
        }
    }, [workflowToEdit, isOpen]);

    if (!workflow) return null;

    const handleWorkflowChange = (field: keyof Workflow, value: any) => {
        setWorkflow(prev => prev ? { ...prev, [field]: value } : null);
    };

    const addTask = () => {
        const newTask: Task = { ...emptyTask, id: `task-${generateId().slice(0, 8)}` };
        handleWorkflowChange('tasks', [...workflow.tasks, newTask]);
    };

    const updateTask = (updatedTask: Task) => {
        const newTasks = workflow.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        handleWorkflowChange('tasks', newTasks);
    };

    const removeTask = (taskId: string) => {
        const newTasks = workflow.tasks.filter(t => t.id !== taskId);
        const cleanedTasks = newTasks.map(t => ({
            ...t,
            dependencies: t.dependencies.filter(d => d !== taskId)
        }));
        handleWorkflowChange('tasks', cleanedTasks);
    };

    const handleSubmit = () => {
        onSave(workflow);
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A69E2] focus:border-[#4A69E2]";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={workflowToEdit && !workflowToEdit.isDefault ? 'Edit Workflow' : 'Create Workflow'} size="4xl">
            <div className="space-y-6">
                <div className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                     <div><label className={labelClasses}>Workflow Name</label><input type="text" value={workflow.name} onChange={(e) => handleWorkflowChange('name', e.target.value)} className={commonInputClasses} /></div>
                     <div><label className={labelClasses}>Workflow Description</label><textarea value={workflow.description} onChange={(e) => handleWorkflowChange('description', e.target.value)} rows={2} className={commonInputClasses} /></div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Tasks</h3>
                    {workflow.tasks.map(task => (
                        <TaskEditor
                            key={task.id}
                            task={task}
                            updateTask={updateTask}
                            removeTask={() => removeTask(task.id)}
                            availableDependencies={workflow.tasks.filter(t => t.id !== task.id).map(t => ({id: t.id, name: t.name}))}
                            prompts={prompts}
                        />
                    ))}
                    <button type="button" onClick={addTask} className="w-full flex items-center justify-center space-x-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Add Task</span>
                    </button>
                </div>

                 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-[#4A69E2] rounded-md hover:bg-opacity-90">Save Workflow</button>
                </div>
            </div>
        </ModalShell>
    );
};

export default WorkflowEditorModal;