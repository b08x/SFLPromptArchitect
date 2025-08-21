/**
 * @file TaskNode.tsx
 * @description This component renders a single node within the workflow canvas, representing a task.
 * It displays the task's name, description, inputs, and outputs. The appearance of the node
 * changes based on its current execution status (e.g., pending, running, completed, failed).
 *
 * @requires react
 * @requires ../../types
 * @requires ../icons/CodeBracketIcon
 * @requires ../icons/SparklesIcon
 * @requires ../icons/DocumentTextIcon
 * @requires ../icons/PresentationChartLineIcon
 * @requires ../icons/EyeIcon
 * @requires ../icons/LinkIcon
 */

import React from 'react';
import { Task, TaskState, TaskStatus, TaskType } from '../../types';
import CodeBracketIcon from '../icons/CodeBracketIcon';
import SparklesIcon from '../icons/SparklesIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import PresentationChartLineIcon from '../icons/PresentationChartLineIcon';
import EyeIcon from '../icons/EyeIcon';
import LinkIcon from '../icons/LinkIcon';

/**
 * A component that returns an appropriate icon for a given task type.
 * @param {object} props - The component props.
 * @param {TaskType} props.type - The type of the task.
 * @returns {JSX.Element} A styled icon component.
 */
const TaskIcon: React.FC<{ type: TaskType }> = ({ type }) => {
    const commonClasses = "w-5 h-5";
    switch (type) {
        case TaskType.DATA_INPUT: return <DocumentTextIcon className={commonClasses} />;
        case TaskType.GEMINI_PROMPT: return <SparklesIcon className={commonClasses} />;
        case TaskType.GEMINI_GROUNDED: return <SparklesIcon className={commonClasses} />;
        case TaskType.IMAGE_ANALYSIS: return <EyeIcon className={commonClasses} />;
        case TaskType.TEXT_MANIPULATION: return <CodeBracketIcon className={commonClasses} />;
        case TaskType.DISPLAY_CHART: return <PresentationChartLineIcon className={commonClasses} />;
        default: return <DocumentTextIcon className={commonClasses} />;
    }
};

/**
 * A configuration object that maps task statuses to specific CSS classes for styling.
 */
const statusConfig = {
    [TaskStatus.PENDING]: { bg: 'bg-surface', border: 'border-border-primary', text: 'text-text-tertiary', iconBg: 'bg-surface-hover' },
    [TaskStatus.RUNNING]: { bg: 'bg-info-bg', border: 'border-info ring-2 ring-info/20', text: 'text-info', iconBg: 'bg-info/20' },
    [TaskStatus.COMPLETED]: { bg: 'bg-success-bg', border: 'border-success', text: 'text-success', iconBg: 'bg-success/20' },
    [TaskStatus.FAILED]: { bg: 'bg-error-bg', border: 'border-error', text: 'text-error', iconBg: 'bg-error/20' },
    [TaskStatus.SKIPPED]: { bg: 'bg-warning-bg', border: 'border-warning', text: 'text-warning', iconBg: 'bg-warning/20' },
};

/**
 * @interface TaskNodeProps
 * @description Defines the props for the TaskNode component.
 * @property {Task} task - The task object to render.
 * @property {TaskState} state - The current execution state of the task.
 * @property {() => void} onClick - Callback function to be invoked when the node is clicked.
 */
interface TaskNodeProps {
    task: Task;
    state: TaskState;
    onClick: () => void;
}

/**
 * A component that renders a visual representation of a workflow task.
 * It displays the task's details and dynamically changes its style based on the execution status.
 *
 * @param {TaskNodeProps} props - The props for the component.
 * @returns {JSX.Element} The rendered task node.
 */
const TaskNode: React.FC<TaskNodeProps> = ({ task, state, onClick }) => {
    const config = statusConfig[state.status];

    const getResultSummary = () => {
        if (state.status !== TaskStatus.COMPLETED || !state.result) return null;
        if(typeof state.result === 'string') return state.result.substring(0, 50) + (state.result.length > 50 ? '...' : '');
        if(typeof state.result === 'object') return `[Object] Keys: ${Object.keys(state.result).slice(0,3).join(', ')}`;
        return String(state.result);
    }
    
    const duration = (state.startTime && state.endTime) ? `${((state.endTime - state.startTime)/1000).toFixed(2)}s` : null;

    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${config.bg} ${config.border}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${config.iconBg}`}>
                        <TaskIcon type={task.type} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-text-primary">{task.name}</h3>
                        {task.promptId && <span title="Linked to SFL Prompt Library"><LinkIcon className="w-4 h-4 text-text-tertiary" /></span>}
                    </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                    {state.status}
                </span>
            </div>
            <p className="text-xs text-text-tertiary mt-2 h-8 overflow-hidden">{task.description}</p>
            
            <div className="mt-3 pt-3 border-t border-border-primary text-xs space-y-1">
                <p><span className="font-medium text-text-secondary">Inputs:</span> <span className="text-text-tertiary truncate">{task.inputKeys.join(', ') || 'None'}</span></p>
                <p><span className="font-medium text-text-secondary">Output:</span> <span className="text-text-tertiary">{task.outputKey}</span></p>
            </div>
            
             {state.status === TaskStatus.COMPLETED && (
                <div className="mt-2 pt-2 border-t border-border-primary text-xs">
                    <p className="font-medium text-success">Result:</p>
                    <p className="text-text-secondary break-words h-6 overflow-hidden">{getResultSummary()}</p>
                </div>
            )}
            
            {state.status === TaskStatus.FAILED && state.error && (
                <div className="mt-2 pt-2 border-t border-border-primary text-xs">
                    <p className="font-medium text-error">Error:</p>
                    <p className="text-error break-words h-6 overflow-hidden">{state.error}</p>
                </div>
            )}
            
            {duration && (
                <div className="text-right text-xs text-text-tertiary mt-2">
                    {duration}
                </div>
            )}
        </div>
    );
};

export default TaskNode;