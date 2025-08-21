/**
 * @file WorkflowControls.tsx
 * @description This component provides the main controls for managing workflows, including selecting,
 * creating, editing, deleting, importing, and exporting workflows.
 *
 * @requires react
 * @requires ../../types
 * @requires ../icons/PlusIcon
 * @requires ../icons/MagicWandIcon
 * @requires ../icons/PencilIcon
 * @requires ../icons/TrashIcon
 * @requires ../icons/ArrowUpTrayIcon
 * @requires ../icons/ArrowDownTrayIcon
 */

import React, { useRef } from 'react';
import { Workflow } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import MagicWandIcon from '../icons/MagicWandIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import ArrowUpTrayIcon from '../icons/ArrowUpTrayIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';

/**
 * @interface WorkflowControlsProps
 * @description Defines the props for the WorkflowControls component.
 * @property {Workflow[]} workflows - The list of all available workflows.
 * @property {Workflow | null} activeWorkflow - The currently selected workflow.
 * @property {(id: string) => void} onSelectWorkflow - Callback to select a workflow.
 * @property {() => void} onOpenEditor - Callback to open the workflow editor modal.
 * @property {() => void} onOpenWizard - Callback to open the workflow creation wizard.
 * @property {(id: string) => void} onDeleteWorkflow - Callback to delete a workflow.
 * @property {(workflows: Workflow[]) => void} onImportWorkflows - Callback to handle importing workflows from a file.
 */
interface WorkflowControlsProps {
    workflows: Workflow[];
    activeWorkflow: Workflow | null;
    onSelectWorkflow: (id: string) => void;
    onOpenEditor: () => void;
    onOpenWizard: () => void;
    onDeleteWorkflow: (id: string) => void;
    onImportWorkflows: (workflows: Workflow[]) => void;
}

/**
 * A component that provides UI controls for managing workflows.
 * It allows users to switch between workflows, create new ones, and perform other management tasks.
 *
 * @param {WorkflowControlsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered workflow controls panel.
 */
const WorkflowControls: React.FC<WorkflowControlsProps> = ({
    workflows,
    activeWorkflow,
    onSelectWorkflow,
    onOpenEditor,
    onOpenWizard,
    onDeleteWorkflow,
    onImportWorkflows
}) => {
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!activeWorkflow) return alert("No workflow selected to export.");
        const data = JSON.stringify([activeWorkflow], null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeWorkflow.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const importedData = JSON.parse(content);
                if (!Array.isArray(importedData)) {
                    throw new Error("Imported file must be a JSON array of workflows.");
                }
                onImportWorkflows(importedData);
            } catch (err: any) {
                alert(`Import failed: ${err.message}`);
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    return (
        <div className="p-4 bg-surface rounded-lg border border-border-primary space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Workflow Controls</h2>
            
            <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".json" />

            <div>
                <label htmlFor="workflow-select" className="block text-sm font-medium text-text-secondary mb-1">Select Workflow</label>
                <select
                    id="workflow-select"
                    value={activeWorkflow?.id || ''}
                    onChange={(e) => onSelectWorkflow(e.target.value)}
                    className="input-field w-full"
                >
                    <optgroup label="Default Workflows">
                        {workflows.filter(w => w.isDefault).map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </optgroup>
                    <optgroup label="Custom Workflows">
                        {workflows.filter(w => !w.isDefault).map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </optgroup>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={onOpenEditor} className="btn-secondary flex items-center justify-center space-x-2 text-sm"><PlusIcon className="w-4 h-4"/><span>New</span></button>
                <button onClick={onOpenWizard} className="btn-secondary flex items-center justify-center space-x-2 text-sm"><MagicWandIcon className="w-4 h-4"/><span>Wizard</span></button>
            </div>
            
            {activeWorkflow && (
                <div className="border-t border-border-primary pt-4 space-y-2">
                     <p className="text-xs text-text-tertiary">{activeWorkflow.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={onOpenEditor} 
                            className="btn-secondary flex items-center justify-center space-x-2 text-sm"
                            title={activeWorkflow.isDefault ? "Clone to edit" : "Edit this workflow"}
                        >
                            <PencilIcon className="w-4 h-4"/>
                            <span>{activeWorkflow.isDefault ? "Clone" : "Edit"}</span>
                        </button>
                        <button 
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${activeWorkflow.name}"?`)) {
                                    onDeleteWorkflow(activeWorkflow.id);
                                }
                            }}
                            disabled={activeWorkflow.isDefault}
                            className="btn-secondary flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <TrashIcon className="w-4 h-4"/>
                            <span>Delete</span>
                        </button>
                        <button onClick={handleImportClick} className="btn-secondary flex items-center justify-center space-x-2 text-sm">
                            <ArrowUpTrayIcon className="w-4 h-4"/>
                            <span>Import</span>
                        </button>
                        <button onClick={handleExport} className="btn-secondary flex items-center justify-center space-x-2 text-sm">
                           <ArrowDownTrayIcon className="w-4 h-4"/>
                           <span>Export</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowControls;