/**
 * @file TaskDetailModal.tsx
 * @description This component renders a modal dialog that displays the detailed configuration and execution state of a single workflow task.
 * It shows all properties of the task, and if available, the execution status, timings, results, or errors.
 * It also includes a chart renderer for tasks that output chartable data.
 *
 * @requires react
 * @requires recharts
 * @requires ../../../types
 * @requires ../../ModalShell
 */

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Task, TaskState, TaskType, PromptSFL } from '../../../types';
import ModalShell from '../../ModalShell';

/**
 * A component to display a single key-value detail item.
 * @param {object} props - The component props.
 * @param {string} props.label - The label for the detail.
 * @param {any} [props.value] - The value to be displayed. Objects will be stringified.
 * @param {boolean} [props.isCode=false] - If true, the value is rendered in a code block style.
 * @returns {JSX.Element | null} The rendered detail item, or null if the value is empty.
 */
const DetailItem: React.FC<{ label: string; value?: any; isCode?: boolean }> = ({ label, value, isCode }) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return null;

    let displayValue = value;
    if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
    } else {
        displayValue = String(value);
    }
    
    return (
        <div>
            <h4 className="text-sm font-semibold text-text-secondary mb-1">{label}</h4>
            <pre className={`p-3 rounded-md text-sm whitespace-pre-wrap break-all border ${isCode ? 'bg-surface border-border-primary text-text-primary' : 'bg-info-bg border-info text-info'}`}>
                {displayValue}
            </pre>
        </div>
    );
};

/**
 * A component to render a bar chart for task results.
 * @param {object} props - The component props.
 * @param {any[]} props.data - The data array for the chart. Expected to have `name` and `value` properties.
 * @returns {JSX.Element} A responsive bar chart or a message if data is invalid.
 */
const ChartRenderer: React.FC<{data: any[]}> = ({data}) => {
    if (!Array.isArray(data) || data.length === 0) {
        return <p className="text-sm text-text-tertiary">No data available for chart.</p>;
    }
    const sample = data[0];
    if (typeof sample !== 'object' || !sample.name || !sample.value) {
         return <DetailItem label="Chart Data" value={data} isCode />;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="var(--color-accent-primary)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

/**
 * @interface TaskDetailModalProps
 * @description Defines the props for the TaskDetailModal component.
 * @property {boolean} isOpen - Whether the modal is currently open.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {Task} task - The task object whose details are to be displayed.
 * @property {TaskState} [taskState] - The current execution state of the task.
 * @property {PromptSFL[]} prompts - The library of available SFL prompts to find linked prompt details.
 */
interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    taskState?: TaskState;
    prompts: PromptSFL[];
}

/**
 * A modal that displays comprehensive details about a specific workflow task.
 *
 * @param {TaskDetailModalProps} props - The props for the component.
 * @returns {JSX.Element} The rendered task detail modal.
 */
const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, taskState, prompts }) => {
    const linkedPrompt = task.promptId ? prompts.find(p => p.id === task.promptId) : null;
    
    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={`Task Details: ${task.name}`} size="3xl">
            <div className="space-y-6">
                <section>
                    <h3 className="text-lg font-bold text-text-primary mb-2 border-b border-border-primary pb-2">Configuration</h3>
                    <div className="space-y-3 mt-2 text-sm">
                        <p><strong>ID:</strong> {task.id}</p>
                        <p><strong>Description:</strong> {task.description}</p>
                        <p><strong>Type:</strong> {task.type}</p>
                        {linkedPrompt && <p><strong>Linked Prompt:</strong> {linkedPrompt.title}</p>}
                        <DetailItem label="Dependencies" value={task.dependencies} isCode />
                        <DetailItem label="Input Keys" value={task.inputKeys} isCode />
                        <DetailItem label="Output Key" value={task.outputKey} isCode />
                        <DetailItem label="Prompt Template" value={task.promptTemplate} isCode />
                        <DetailItem label="Function Body" value={task.functionBody} isCode />
                        <DetailItem label="Static Value" value={task.staticValue} isCode />
                        <DetailItem label="Agent Config" value={task.agentConfig} isCode />
                    </div>
                </section>
                
                {taskState && (
                     <section>
                        <h3 className="text-lg font-bold text-text-primary mb-2 border-b border-border-primary pb-2">Execution State</h3>
                         <div className="space-y-3 mt-2 text-sm">
                            <p><strong>Status:</strong> {taskState.status}</p>
                            {taskState.startTime && <p><strong>Start Time:</strong> {new Date(taskState.startTime).toLocaleString()}</p>}
                            {taskState.endTime && <p><strong>End Time:</strong> {new Date(taskState.endTime).toLocaleString()}</p>}
                            {taskState.startTime && taskState.endTime && <p><strong>Duration:</strong> {((taskState.endTime - taskState.startTime)/1000).toFixed(3)} seconds</p>}
                            
                            {task.type === TaskType.DISPLAY_CHART && taskState.result ? (
                                <div>
                                    <h4 className="text-sm font-semibold text-text-secondary mb-1">Chart</h4>
                                    <ChartRenderer data={taskState.result} />
                                </div>
                            ) : (
                                <DetailItem label="Result" value={taskState.result} />
                            )}
                            
                            <DetailItem label="Error" value={taskState.error} />
                         </div>
                    </section>
                )}
                 <div className="flex justify-end pt-4 border-t border-border-primary">
                    <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
            </div>
        </ModalShell>
    );
};

export default TaskDetailModal;