
import React, { useState } from 'react';
import { PromptSFL } from '../types';
import { generateSFLFromGoal } from '../services/geminiService';
import { INITIAL_PROMPT_SFL, TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS } from '../constants';
import ModalShell from './ModalShell';

interface PromptWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prompt: PromptSFL) => void;
}

type WizardStep = 'input' | 'loading' | 'refinement' | 'error';

const PromptWizardModal: React.FC<PromptWizardModalProps> = ({ isOpen, onClose, onSave }) => {
    const [step, setStep] = useState<WizardStep>('input');
    const [goal, setGoal] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>(INITIAL_PROMPT_SFL);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setErrorMessage('Please enter your goal.');
            setStep('error');
            setTimeout(() => setStep('input'), 3000);
            return;
        }
        setStep('loading');
        setErrorMessage('');

        try {
            const generatedData = await generateSFLFromGoal(goal);
            setFormData(generatedData);
            setStep('refinement');
        } catch (error: any) {
            setErrorMessage(error.message || 'An unknown error occurred.');
            setStep('error');
        }
    };
    
    const handleReset = () => {
        setGoal('');
        setFormData(INITIAL_PROMPT_SFL);
        setErrorMessage('');
        setStep('input');
    };

    const handleSave = () => {
        const now = new Date().toISOString();
        const finalPrompt: PromptSFL = {
            ...formData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
            isTesting: false,
        };
        onSave(finalPrompt);
        onClose();
    };
    
    const handleCloseAndReset = () => {
        handleReset();
        onClose();
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]";
    const labelClasses = "block text-sm font-medium text-[#95aac0] mb-1";
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSFLChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const [sflType, field] = name.split('.'); // e.g., name="sflField.topic"
        setFormData(prev => ({
            ...prev,
            [sflType]: {
                ...prev[sflType],
                [field]: value,
            },
        }));
    };
    
    const renderOption = (o) => <option key={o} value={o} className="bg-[#212934] text-gray-200">{o}</option>;

    const renderRefinementForm = () => (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
             <div>
                <label htmlFor="title" className={labelClasses}>Title</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="promptText" className={labelClasses}>Prompt Text</label>
                <textarea id="promptText" name="promptText" value={formData.promptText} onChange={handleFormChange} rows={5} className={commonInputClasses} />
            </div>

            <fieldset className="border border-[#5c6f7e] p-4 rounded-md">
              <legend className="text-lg font-medium text-gray-200 px-2">SFL: Field</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><label className={labelClasses}>Topic</label><input type="text" name="sflField.topic" value={formData.sflField.topic} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div><label className={labelClasses}>Task Type</label><select name="sflField.taskType" value={formData.sflField.taskType} onChange={handleSFLChange} className={commonInputClasses}><option value="">Select...</option>{TASK_TYPES.map(renderOption)}</select></div>
                <div className="md:col-span-2"><label className={labelClasses}>Domain Specifics</label><input type="text" name="sflField.domainSpecifics" value={formData.sflField.domainSpecifics} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div className="md:col-span-2"><label className={labelClasses}>Keywords</label><input type="text" name="sflField.keywords" value={formData.sflField.keywords} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>
            
            <fieldset className="border border-[#5c6f7e] p-4 rounded-md">
              <legend className="text-lg font-medium text-gray-200 px-2">SFL: Tenor</legend>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><label className={labelClasses}>AI Persona</label><select name="sflTenor.aiPersona" value={formData.sflTenor.aiPersona} onChange={handleSFLChange} className={commonInputClasses}><option value="">Select...</option>{AI_PERSONAS.map(renderOption)}</select></div>
                <div><label className={labelClasses}>Target Audience</label><select name="sflTenor.targetAudience" value={formData.sflTenor.targetAudience} onChange={handleSFLChange} className={commonInputClasses}><option value="">Select...</option>{TARGET_AUDIENCES.map(renderOption)}</select></div>
                <div><label className={labelClasses}>Desired Tone</label><select name="sflTenor.desiredTone" value={formData.sflTenor.desiredTone} onChange={handleSFLChange} className={commonInputClasses}><option value="">Select...</option>{DESIRED_TONES.map(renderOption)}</select></div>
                <div><label className={labelClasses}>Interpersonal Stance</label><input type="text" name="sflTenor.interpersonalStance" value={formData.sflTenor.interpersonalStance} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>

            <fieldset className="border border-[#5c6f7e] p-4 rounded-md">
              <legend className="text-lg font-medium text-gray-200 px-2">SFL: Mode</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><label className={labelClasses}>Output Format</label><select name="sflMode.outputFormat" value={formData.sflMode.outputFormat} onChange={handleSFLChange} className={commonInputClasses}><option value="">Select...</option>{OUTPUT_FORMATS.map(renderOption)}</select></div>
                <div><label className={labelClasses}>Length Constraint</label><select name="sflMode.lengthConstraint" value={formData.sflMode.lengthConstraint} onChange={handleSFLChange} className={commonInputClasses}><option value="">Select...</option>{LENGTH_CONSTRAINTS.map(renderOption)}</select></div>
                <div className="md:col-span-2"><label className={labelClasses}>Rhetorical Structure</label><input type="text" name="sflMode.rhetoricalStructure" value={formData.sflMode.rhetoricalStructure} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div className="md:col-span-2"><label className={labelClasses}>Textual Directives</label><input type="text" name="sflMode.textualDirectives" value={formData.sflMode.textualDirectives} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>

            <div>
                <label htmlFor="exampleOutput" className={labelClasses}>Example Output (Optional)</label>
                <textarea id="exampleOutput" name="exampleOutput" value={formData.exampleOutput} onChange={handleFormChange} rows={3} className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleFormChange} rows={2} className={commonInputClasses} />
            </div>
        </form>
    );

    const renderContent = () => {
        switch (step) {
            case 'input':
                return (
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                        <label htmlFor="goal" className="block text-lg text-[#95aac0] mb-2">Describe your prompt's goal</label>
                        <textarea
                            id="goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g., I want a short, funny poem about a cat who is a senior software engineer."
                            rows={6}
                            className={commonInputClasses}
                            aria-label="Your prompt goal"
                        />
                         <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleCloseAndReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95aac0] focus:ring-offset-[#333e48]">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#c36e26] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e2a32d] focus:ring-offset-[#333e48]">Generate SFL Prompt</button>
                        </div>
                    </form>
                );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                        <div className="spinner mb-4"></div>
                        <p className="text-lg text-[#e2a32d]">Generating SFL structure...</p>
                        <p className="text-[#95aac0] text-sm">This may take a moment.</p>
                    </div>
                );
            case 'refinement':
                return (
                   <div className="space-y-6">
                       {renderRefinementForm()}
                       <div className="flex justify-end space-x-3 pt-4 border-t border-[#5c6f7e] mt-6">
                            <button type="button" onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95aac0] focus:ring-offset-[#333e48]">Start Over</button>
                            <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#c36e26] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e2a32d] focus:ring-offset-[#333e48]">Save Prompt</button>
                       </div>
                   </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-900/30 border border-red-700 rounded-lg">
                        <h4 className="text-lg font-bold text-red-300 mb-2">Error</h4>
                        <p className="text-red-300 mb-4">{errorMessage}</p>
                        <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90">Try Again</button>
                    </div>
                );
        }
    };

    return (
        <ModalShell isOpen={isOpen} onClose={handleCloseAndReset} title="Prompt Wizard" size="4xl">
            {renderContent()}
        </ModalShell>
    );
};

export default PromptWizardModal;
