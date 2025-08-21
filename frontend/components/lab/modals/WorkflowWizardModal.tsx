/**
 * @file WorkflowWizardModal.tsx
 * @description This component provides a user-friendly wizard for creating a new workflow from a high-level goal.
 * It takes a natural language description from the user, uses an AI service to generate a structured workflow,
 * and then presents the generated workflow in an editor for refinement before saving.
 *
 * @requires react
 * @requires ../../../types
 * @requires ../../../services/geminiService
 * @requires ../../ModalShell
 * @requires ./WorkflowEditorModal
 */

import React, { useState } from 'react';
import { Workflow, PromptSFL } from '../../../types';
import { generateWorkflowFromGoal } from '../../../services/geminiService';
import ModalShell from '../../ModalShell';
import WorkflowEditorModal from './WorkflowEditorModal';

/**
 * @interface WorkflowWizardModalProps
 * @description Defines the props for the WorkflowWizardModal component.
 * @property {boolean} isOpen - Whether the modal is currently open.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {(workflow: Workflow) => void} onSave - Callback function to save the created workflow.
 * @property {PromptSFL[]} prompts - The library of available SFL prompts, passed to the editor.
 */
interface WorkflowWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workflow: Workflow) => void;
    prompts: PromptSFL[];
}

type WizardStep = 'input' | 'loading' | 'refinement' | 'error';

/**
 * A modal wizard for creating workflows from a natural language goal.
 *
 * @param {WorkflowWizardModalProps} props - The props for the component.
 * @returns {JSX.Element} The rendered wizard modal.
 */
const WorkflowWizardModal: React.FC<WorkflowWizardModalProps> = ({ isOpen, onClose, onSave, prompts }) => {
    const [step, setStep] = useState<WizardStep>('input');
    const [goal, setGoal] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [generatedWorkflow, setGeneratedWorkflow] = useState<Workflow | null>(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setErrorMessage('Please describe your workflow goal.');
            return;
        }
        setStep('loading');
        setErrorMessage('');
        try {
            const workflow = await generateWorkflowFromGoal(goal);
            setGeneratedWorkflow(workflow);
            setStep('refinement');
        } catch (error: any) {
            setErrorMessage(error.message || 'An unknown error occurred.');
            setStep('error');
        }
    };
    
    const handleCloseAndReset = () => {
        setStep('input');
        setGoal('');
        setErrorMessage('');
        setGeneratedWorkflow(null);
        onClose();
    };

    const renderContent = () => {
        switch (step) {
            case 'input':
                return (
                    <div className="space-y-4">
                        <p className="text-text-secondary">Describe the multi-step process you want to automate. The AI will generate a structured workflow with all the necessary tasks, inputs, and outputs.</p>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            rows={5}
                            placeholder="e.g., 'Take a user-provided article URL, fetch its content, summarize it, and then translate the summary into Spanish.'"
                            className="input-field w-full"
                        />
                        {errorMessage && <p className="text-error text-sm">{errorMessage}</p>}
                        <div className="flex justify-end space-x-2">
                             <button onClick={handleCloseAndReset} className="btn-secondary">Cancel</button>
                             <button onClick={handleGenerate} className="btn-primary">Generate Workflow</button>
                        </div>
                    </div>
                );
            case 'loading':
                 return (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-48">
                        <div className="spinner mb-4"></div>
                        <p className="text-lg text-text-primary">Generating workflow...</p>
                    </div>
                );
            case 'refinement':
                return (
                    <WorkflowEditorModal
                        isOpen={true}
                        onClose={handleCloseAndReset}
                        onSave={onSave}
                        workflowToEdit={generatedWorkflow}
                        prompts={prompts}
                    />
                );
            case 'error':
                 return (
                    <div className="text-center p-4 bg-error-bg border border-error rounded-lg">
                        <p className="font-semibold text-error">Generation Failed</p>
                        <p className="text-error text-sm mt-1">{errorMessage}</p>
                        <button onClick={() => setStep('input')} className="btn-secondary mt-4">Try Again</button>
                    </div>
                 );
        }
    };

    if (step === 'refinement') {
        return renderContent();
    }

    return (
        <ModalShell isOpen={isOpen} onClose={handleCloseAndReset} title="AI Workflow Wizard">
            {renderContent()}
        </ModalShell>
    );
};

export default WorkflowWizardModal;
