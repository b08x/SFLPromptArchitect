/**
 * @file PromptLabPage.tsx
 * @description This is the main component for the "Prompt Lab" page. It orchestrates the entire workflow management UI,
 * including the workflow selection controls, user input area, and the main workflow canvas. It also manages the state
 * for the active workflow and modals for editing or creating new workflows.
 *
 * @requires react
 * @requires ../../types
 * @requires ../../hooks/useWorkflowManager
 * @requires ./WorkflowControls
 * @requires ./UserInputArea
 * @requires ./DataStoreViewer
 * @requires ./WorkflowCanvas
 * @requires ./modals/WorkflowEditorModal
 * @requires ./modals/WorkflowWizardModal
 */

import React, { useState, useEffect } from 'react';
import { Workflow, ModalType, StagedUserInput } from '../../types';
import { useAppStore } from '../../store/appStore';
import { useWorkflowManager } from '../../hooks/useWorkflowManager';
import WorkflowControls from './WorkflowControls';
import UserInputArea from './UserInputArea';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowEditorModal from './modals/WorkflowEditorModal';
import WorkflowWizardModal from './modals/WorkflowWizardModal';

/**
 * @interface PromptLabPageProps
 * @description Defines the props for the PromptLabPage component.
 * No props are needed as prompts are accessed from the store.
 */
interface PromptLabPageProps {}

/**
 * The main page component for the Prompt Lab feature.
 * It integrates all the necessary components to provide a complete workflow management experience.
 *
 * @param {PromptLabPageProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Prompt Lab page.
 */
const PromptLabPage: React.FC<PromptLabPageProps> = () => {
    const { prompts } = useAppStore();
    const { workflows, saveWorkflow, deleteWorkflow, isLoading, saveCustomWorkflows } = useWorkflowManager();
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
    const [stagedInput, setStagedInput] = useState<StagedUserInput>({});

    const activeWorkflow = workflows.find(wf => wf.id === activeWorkflowId) || null;

    useEffect(() => {
        if (!isLoading && workflows.length > 0 && !activeWorkflowId) {
            setActiveWorkflowId(workflows[0].id);
        }
    }, [isLoading, workflows, activeWorkflowId]);

    const handleOpenModal = (modalType: ModalType) => setActiveModal(modalType);
    const handleCloseModal = () => setActiveModal(ModalType.NONE);

    const handleSaveWorkflow = (workflow: Workflow) => {
        saveWorkflow(workflow);
        setActiveWorkflowId(workflow.id);
        handleCloseModal();
    };
    
    const handleImportWorkflows = (importedWorkflows: Workflow[]) => {
        const customWorkflows = workflows.filter(wf => !wf.isDefault);
        const merged = [...customWorkflows];
        
        importedWorkflows.forEach(iw => {
            const index = merged.findIndex(cw => cw.id === iw.id);
            if (index !== -1) {
                merged[index] = iw;
            } else {
                merged.push(iw);
            }
        });
        
        saveCustomWorkflows(merged);
        alert(`Import successful. ${importedWorkflows.length} workflows imported/updated.`);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="spinner"></div></div>;
    }

    return (
        <div className="flex h-full bg-app-bg font-sans">
            <aside className="w-[350px] bg-surface border-r border-border-primary flex flex-col p-4 space-y-4 overflow-y-auto">
                <WorkflowControls
                    workflows={workflows}
                    activeWorkflow={activeWorkflow}
                    onSelectWorkflow={setActiveWorkflowId}
                    onOpenEditor={() => handleOpenModal(ModalType.WORKFLOW_EDITOR)}
                    onOpenWizard={() => handleOpenModal(ModalType.WORKFLOW_WIZARD)}
                    onDeleteWorkflow={deleteWorkflow}
                    onImportWorkflows={handleImportWorkflows}
                />
                <UserInputArea onStageInput={setStagedInput} onWorkflowGenerated={handleSaveWorkflow} />
            </aside>
            
            <main className="flex-1 flex flex-col overflow-hidden">
                 {activeWorkflow ? (
                    <WorkflowCanvas
                        key={activeWorkflow.id}
                        workflow={activeWorkflow}
                        stagedInput={stagedInput}
                        prompts={prompts}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-text-secondary">
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary">No Workflow Selected</h2>
                            <p>Please select a workflow from the sidebar, or create a new one.</p>
                        </div>
                    </div>
                )}
            </main>

            {activeModal === ModalType.WORKFLOW_EDITOR && (
                <WorkflowEditorModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={handleSaveWorkflow}
                    workflowToEdit={activeWorkflow?.isDefault ? null : activeWorkflow}
                    prompts={prompts}
                />
            )}
            
            {activeModal === ModalType.WORKFLOW_WIZARD && (
                <WorkflowWizardModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={handleSaveWorkflow}
                    prompts={prompts}
                />
            )}
        </div>
    );
};

export default PromptLabPage;