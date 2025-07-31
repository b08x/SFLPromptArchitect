/**
 * @file WorkflowCanvas.tsx
 * @description This component serves as the main interactive area for a selected workflow.
 * It displays all the tasks as nodes, provides controls to run or reset the workflow,
 * and shows the live state of the Data Store as the workflow executes.
 *
 * @requires react
 * @requires ../../types
 * @requires ../../hooks/useWorkflowRunner
 * @requires ./TaskNode
 * @requires ./DataStoreViewer
 * @requires ../icons/PlayIcon
 * @requires ../icons/ArrowPathIcon
 * @requires ./modals/TaskDetailModal
 */

import React, { useState } from 'react';
import { Workflow, StagedUserInput, TaskStatus, PromptSFL } from '../../types';
import { useWorkflowRunner } from '../../hooks/useWorkflowRunner';
import TaskNode from './TaskNode';
import DataStoreViewer from './DataStoreViewer';
import PlayIcon from '../icons/PlayIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import TaskDetailModal from './modals/TaskDetailModal';

/**
 * @interface WorkflowCanvasProps
 * @description Defines the props for the WorkflowCanvas component.
 * @property {Workflow} workflow - The workflow object to be displayed and executed.
 * @property {StagedUserInput} stagedInput - The user input that has been staged for the workflow run.
 * @property {PromptSFL[]} prompts - The library of available SFL prompts.
 */
interface WorkflowCanvasProps {
    workflow: Workflow;
    stagedInput: StagedUserInput;
    prompts: PromptSFL[];
}

/**
 * The main canvas for visualizing and running a workflow.
 * It uses the `useWorkflowRunner` hook to manage the execution logic and state.
 *
 * @param {WorkflowCanvasProps} props - The props for the component.
 * @returns {JSX.Element} The rendered workflow canvas.
 */
const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow, stagedInput, prompts }) => {
    const { dataStore, taskStates, isRunning, run, reset, runFeedback } = useWorkflowRunner(workflow, prompts);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<string | null>(null);

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskForDetail(taskId);
    };
    
    const taskForModal = workflow.tasks.find(t => t.id === selectedTaskForDetail);
    const taskStateForModal = selectedTaskForDetail ? taskStates[selectedTaskForDetail] : undefined;

    return (
        <div className="flex-1 flex flex-col h-full">
            <header className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{workflow.name}</h2>
                    <p className="text-sm text-gray-500">{workflow.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => reset()}
                        disabled={isRunning}
                        className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={() => run(stagedInput)}
                        disabled={isRunning}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isRunning ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <PlayIcon className="w-5 h-5" />}
                        <span>{isRunning ? 'Running...' : 'Run Workflow'}</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                     {runFeedback.length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-xs rounded-r-lg">
                            <p className="font-bold">Execution Notes:</p>
                            <ul className="list-disc list-inside">
                                {runFeedback.map((fb, i) => <li key={i}>{fb}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {workflow.tasks.map(task => (
                            <TaskNode
                                key={task.id}
                                task={task}
                                state={taskStates[task.id] || { status: TaskStatus.PENDING }}
                                onClick={() => handleTaskClick(task.id)}
                            />
                        ))}
                    </div>
                </div>
                
                <aside className="w-[400px] bg-white border-l border-gray-200 overflow-y-auto">
                    <DataStoreViewer dataStore={dataStore} />
                </aside>
            </div>
            
            {selectedTaskForDetail && taskForModal && (
                <TaskDetailModal
                    isOpen={true}
                    onClose={() => setSelectedTaskForDetail(null)}
                    task={taskForModal}
                    taskState={taskStateForModal}
                    prompts={prompts}
                />
            )}
        </div>
    );
};

export default WorkflowCanvas;