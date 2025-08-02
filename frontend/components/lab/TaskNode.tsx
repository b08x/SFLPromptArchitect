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
    [TaskStatus.PENDING]: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-500', iconBg: 'bg-gray-200' },
    [TaskStatus.RUNNING]: { bg: 'bg-blue-50', border: 'border-blue-400 ring-2 ring-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-200' },
    [TaskStatus.COMPLETED]: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', iconBg: 'bg-green-200' },
    [TaskStatus.FAILED]: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700', iconBg: 'bg-red-200' },
    [TaskStatus.SKIPPED]: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', iconBg: 'bg-yellow-200' },
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
                        <h3 className="font-semibold text-gray-800">{task.name}</h3>
                        {task.promptId && <span title="Linked to SFL Prompt Library"><LinkIcon className="w-4 h-4 text-gray-400" /></span>}
                    </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                    {state.status}
                </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 h-8 overflow-hidden">{task.description}</p>
            
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs space-y-1">
                <p><span className="font-medium text-gray-600">Inputs:</span> <span className="text-gray-500 truncate">{task.inputKeys.join(', ') || 'None'}</span></p>
                <p><span className="font-medium text-gray-600">Output:</span> <span className="text-gray-500">{task.outputKey}</span></p>
            </div>
            
             {state.status === TaskStatus.COMPLETED && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                    <p className="font-medium text-green-700">Result:</p>
                    <p className="text-gray-600 break-words h-6 overflow-hidden">{getResultSummary()}</p>
                </div>
            )}
            
            {state.status === TaskStatus.FAILED && state.error && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                    <p className="font-medium text-red-700">Error:</p>
                    <p className="text-red-600 break-words h-6 overflow-hidden">{state.error}</p>
                </div>
            )}
            
            {duration && (
                <div className="text-right text-xs text-gray-400 mt-2">
                    {duration}
                </div>
            )}
        </div>
    );
};

export default TaskNode;