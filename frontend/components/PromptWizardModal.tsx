/**
 * @file PromptWizardModal.tsx
 * @description This component provides a step-by-step wizard in a modal for creating a new SFL prompt.
 * It guides the user through providing a high-level goal, generates an initial SFL structure using an AI service,
 * and then allows the user to refine the generated prompt before saving. This simplifies the prompt creation
 * process for users who may not be familiar with the SFL framework.
 *
 * @requires react
 * @requires ../types
 * @requires ../services/providerService
 * @requires ../constants
 * @requires ./ModalShell
 * @requires ./icons/SparklesIcon
 * @requires ./icons/PaperClipIcon
 * @requires ./icons/XCircleIcon
 */

import React, { useState, useRef } from 'react';
import { PromptSFL } from '../types';
import { generateSFLFromGoal, regenerateSFLFromSuggestion, getPreferredProvider } from '../services/providerService';
import { INITIAL_PROMPT_SFL } from '../constants';
import ModalShell from './ModalShell';
import SparklesIcon from './icons/SparklesIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import XCircleIcon from './icons/XCircleIcon';

/**
 * @interface PromptWizardModalProps
 * @description Defines the props for the `PromptWizardModal` component.
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {(prompt: PromptSFL) => void} onSave - Callback function to save the newly created prompt.
 * @property {object} appConstants - An object containing arrays of predefined options for SFL fields, used in the refinement step.
 * @property {(key: keyof PromptWizardModalProps['appConstants'], value: string) => void} onAddConstant - Callback to add a new user-defined option to the application's constants.
 */
interface PromptWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prompt: PromptSFL) => void;
    appConstants: {
        taskTypes: string[];
        aiPersonas: string[];
        targetAudiences: string[];
        desiredTones: string[];
        outputFormats: string[];
        lengthConstraints: string[];
    };
    onAddConstant: (key: keyof PromptWizardModalProps['appConstants'], value: string) => void;
}

/**
 * @typedef {'input' | 'loading' | 'refinement' | 'error'} WizardStep
 * @description Represents the current step of the wizard workflow, controlling which UI is displayed.
 */
type WizardStep = 'input' | 'loading' | 'refinement' | 'error';

/**
 * A modal wizard that guides users through creating a new SFL prompt using AI assistance.
 * It manages the state for each step of the process:
 * 1. **Input**: User provides a high-level goal.
 * 2. **Loading**: The component calls an AI service to generate an SFL structure.
 * 3. **Refinement**: The user can review and edit the AI-generated prompt in a form.
 * 4. **Error**: Displays an error message if the generation fails.
 *
 * @param {PromptWizardModalProps} props - The props for the component.
 * @returns {JSX.Element} The rendered wizard modal.
 */
const PromptWizardModal: React.FC<PromptWizardModalProps> = ({ isOpen, onClose, onSave, appConstants, onAddConstant }) => {
    const [step, setStep] = useState<WizardStep>('input');
    const [goal, setGoal] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>(INITIAL_PROMPT_SFL);
    const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
    const [regenState, setRegenState] = useState({ shown: false, suggestion: '', loading: false });
    const [saveState, setSaveState] = useState({ saving: false, error: '' });
    const [sourceDoc, setSourceDoc] = useState<{name: string, content: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * @callback handleGenerate
     * @description Initiates the AI generation process. It validates the user's goal,
     * calls the `generateSFLFromGoal` service, and transitions the wizard to the next step.
     */
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
            const { preferredProvider } = await getPreferredProvider();
            const result = await generateSFLFromGoal(goal, sourceDoc?.content, preferredProvider || undefined);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to generate SFL prompt');
            }
            
            setFormData({...result.data, sourceDocument: sourceDoc || undefined });
            setStep('refinement');
        } catch (error: any) {
            setErrorMessage(error.message || 'An unknown error occurred.');
            setStep('error');
        }
    };
    
    /**
     * @function handleReset
     * @description Resets the wizard to its initial state.
     */
    const handleReset = () => {
        setGoal('');
        setFormData(INITIAL_PROMPT_SFL);
        setErrorMessage('');
        setStep('input');
        setRegenState({ shown: false, suggestion: '', loading: false });
        setSaveState({ saving: false, error: '' });
        setSourceDoc(null);
    };

    /**
     * @callback handleSave
     * @description Saves the refined prompt. It performs validation and calls the `onSave` prop.
     */
    const handleSave = async () => {
        setSaveState({ saving: true, error: '' });
        
        if (!formData.title?.trim()) {
            setSaveState({ saving: false, error: 'Title is required' });
            return;
        }
        if (!formData.promptText?.trim()) {
            setSaveState({ saving: false, error: 'Prompt text is required' });
            return;
        }

        try {
            const finalPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'> = {
                ...formData,
                isTesting: false,
            };
            
            await onSave(finalPrompt as PromptSFL);
            setSaveState({ saving: false, error: '' });
            onClose();
        } catch (error) {
            setSaveState({ 
                saving: false, 
                error: error instanceof Error ? error.message : 'Failed to save prompt' 
            });
        }
    };
    
    /**
     * @function handleCloseAndReset
     * @description A wrapper function that resets the wizard's state before calling the `onClose` prop.
     */
    const handleCloseAndReset = () => {
        handleReset();
        onClose();
    };

    /**
     * @callback handleFileChange
     * @description Handles the selection of a source document file.
     * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
     */
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setSourceDoc({ name: file.name, content });
            };
            reader.readAsText(file);
        }
        if(event.target) event.target.value = '';
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A69E2] focus:border-[#4A69E2] transition-colors placeholder-gray-400";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
    
    /**
     * @callback handleFormChange
     * @description Generic change handler for top-level form fields in the refinement step.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The input change event.
     */
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    /**
     * @callback handleSFLChange
     * @description Change handler for nested SFL fields in the refinement step.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - The input change event.
     */
    const handleSFLChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const [sflType, field] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [sflType]: {
                ...prev[sflType],
                [field]: value,
            },
        }));
    };

    /**
     * @callback handleSFLDirectChange
     * @description A direct state updater for SFL fields, used by complex inputs like checkboxes.
     */
    const handleSFLDirectChange = <K extends 'sflField' | 'sflTenor' | 'sflMode', F extends keyof PromptSFL[K]>(sflType: K, field: F, value: any) => {
        setFormData(prev => ({
            ...prev,
            [sflType]: {
                ...prev[sflType],
                [field]: value,
            },
        }));
    }
    
    /**
     * @callback handleTargetAudienceChange
     * @description Toggles an audience in the `targetAudience` array.
     * @param {string} audience - The audience to toggle.
     */
    const handleTargetAudienceChange = (audience: string) => {
        const currentAudiences = formData.sflTenor.targetAudience || [];
        const newAudiences = currentAudiences.includes(audience)
          ? currentAudiences.filter(a => a !== audience)
          : [...currentAudiences, audience];
        handleSFLDirectChange('sflTenor', 'targetAudience', newAudiences);
    };

    /**
     * @callback handleAddNewOption
     * @description Adds a new user-defined option to a creatable select field.
     */
    const handleAddNewOption = <
        K extends 'sflField' | 'sflTenor' | 'sflMode',
        F extends keyof PromptSFL[K]
    >(constantsKey: keyof typeof appConstants, sflKey: K, fieldKey: F) => {
        const value = newOptionValues[String(fieldKey)];
        if(value && value.trim()){
          onAddConstant(constantsKey, value);
          handleSFLDirectChange(sflKey, fieldKey, value);
          setNewOptionValues(prev => ({...prev, [String(fieldKey)]: ''}));
        }
    };
    
    /**
     * @callback handleRegeneratePrompt
     * @description Handles AI-powered refinement of the generated prompt during the refinement step.
     */
    const handleRegeneratePrompt = async () => {
        if (!regenState.suggestion.trim()) return;
        setRegenState(prev => ({ ...prev, loading: true }));
        try {
          const { preferredProvider } = await getPreferredProvider();
          const result = await regenerateSFLFromSuggestion(formData, regenState.suggestion, preferredProvider || undefined);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to regenerate prompt');
          }
          
          setFormData(result.data);
          setRegenState({ shown: false, suggestion: '', loading: false });
        } catch (error) {
          console.error(error);
          alert('Failed to regenerate prompt: ' + (error instanceof Error ? error.message : String(error)));
          setRegenState(prev => ({ ...prev, loading: false }));
        }
    };
    
    /**
     * @function renderCreatableSelect
     * @description Renders a creatable select dropdown component.
     * @returns {JSX.Element}
     * @private
     */
    const renderCreatableSelect = <
        K extends 'sflField' | 'sflTenor' | 'sflMode',
        F extends keyof PromptSFL[K]
    >(label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[], constantsKey: keyof typeof appConstants, sflKey: K, fieldKey: F) => (
        <div>
            <label className={labelClasses}>{label}</label>
            <select name={name} value={value} onChange={onChange} className={commonInputClasses}>
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
             <div className="flex items-center space-x-2 mt-2">
                <input type="text" placeholder="Add new option..." value={newOptionValues[String(fieldKey)] || ''} onChange={e => setNewOptionValues(prev => ({...prev, [String(fieldKey)]: e.target.value}))} className={`${commonInputClasses} text-sm`} />
                <button type="button" onClick={() => handleAddNewOption(constantsKey, sflKey, fieldKey)} className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md shrink-0 text-gray-800">Add</button>
            </div>
        </div>
    );

    /**
     * @function renderRefinementForm
     * @description Renders the full prompt editing form for the 'refinement' step.
     * @returns {JSX.Element}
     * @private
     */
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
            
             {formData.sourceDocument && (
                <div>
                    <label className={labelClasses}>Source Document</label>
                     <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md border border-gray-300">
                        <span className="text-sm text-gray-800 truncate pr-2">{formData.sourceDocument.name}</span>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, sourceDocument: undefined}))} className="text-red-500 hover:text-red-700 shrink-0" aria-label="Remove source document">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}

            <div className="my-2 text-right">
                <button type="button" onClick={() => setRegenState(prev => ({...prev, shown: !prev.shown, suggestion: ''}))} className="text-sm text-[#4A69E2] hover:text-blue-700 flex items-center justify-end">
                    <SparklesIcon className="w-5 h-5 mr-1"/> Refine Prompt with AI
                </button>
            </div>
            
            {regenState.shown && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <label htmlFor="regenSuggestion-wiz" className={`${labelClasses} text-gray-800`}>How should this prompt be changed?</label>
                    <textarea id="regenSuggestion-wiz" value={regenState.suggestion} onChange={e => setRegenState(prev => ({...prev, suggestion: e.target.value}))} rows={2} placeholder="e.g., Make the tone more formal..." className={commonInputClasses} />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setRegenState({ shown: false, suggestion: '', loading: false })} className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="button" onClick={handleRegeneratePrompt} disabled={regenState.loading || !regenState.suggestion.trim()} className="px-3 py-1 text-xs bg-[#4A69E2] text-white rounded-md hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center">
                            {regenState.loading && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>}
                            {regenState.loading ? 'Refining...' : 'Refine'}
                        </button>
                    </div>
                </div>
            )}

            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-medium text-gray-800 px-2">SFL: Field</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><label className={labelClasses}>Topic</label><input type="text" name="sflField.topic" value={formData.sflField.topic} onChange={handleSFLChange} className={commonInputClasses}/></div>
                {renderCreatableSelect('Task Type', 'sflField.taskType', formData.sflField.taskType, handleSFLChange, appConstants.taskTypes, 'taskTypes', 'sflField', 'taskType')}
                <div className="md:col-span-2"><label className={labelClasses}>Domain Specifics</label><input type="text" name="sflField.domainSpecifics" value={formData.sflField.domainSpecifics} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div className="md:col-span-2"><label className={labelClasses}>Keywords</label><input type="text" name="sflField.keywords" value={formData.sflField.keywords} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>
            
            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-medium text-gray-800 px-2">SFL: Tenor</legend>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {renderCreatableSelect('AI Persona', 'sflTenor.aiPersona', formData.sflTenor.aiPersona, handleSFLChange, appConstants.aiPersonas, 'aiPersonas', 'sflTenor', 'aiPersona')}
                {renderCreatableSelect('Desired Tone', 'sflTenor.desiredTone', formData.sflTenor.desiredTone, handleSFLChange, appConstants.desiredTones, 'desiredTones', 'sflTenor', 'desiredTone')}
                <div className="md:col-span-2">
                     <label className={labelClasses}>Target Audience</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-md bg-white">
                        {(appConstants.targetAudiences || []).map(audience => (
                            <div key={audience} className="flex items-center">
                                <input id={`wiz-audience-${audience}`} type="checkbox" checked={(formData.sflTenor.targetAudience || []).includes(audience)} onChange={() => handleTargetAudienceChange(audience)} className="h-4 w-4 rounded border-gray-300 text-[#4A69E2] focus:ring-[#4A69E2]" />
                                <label htmlFor={`wiz-audience-${audience}`} className="ml-2 text-sm text-gray-800 select-none">{audience}</label>
                            </div>
                        ))}
                    </div>
                     <div className="flex items-center space-x-2 mt-2">
                        <input type="text" placeholder="Add new audience..." value={newOptionValues['targetAudience'] || ''} onChange={e => setNewOptionValues(prev => ({...prev, 'targetAudience': e.target.value}))} className={`${commonInputClasses} text-sm`} />
                        <button type="button" onClick={() => {
                            const value = newOptionValues['targetAudience'];
                            if(value && value.trim()){
                                onAddConstant('targetAudiences', value);
                                handleTargetAudienceChange(value);
                                setNewOptionValues(prev => ({...prev, 'targetAudience': ''}));
                            }
                        }} className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md shrink-0 text-gray-800">Add</button>
                    </div>
                </div>
                <div className="md:col-span-2"><label className={labelClasses}>Interpersonal Stance</label><input type="text" name="sflTenor.interpersonalStance" value={formData.sflTenor.interpersonalStance} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>

            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className="text-lg font-medium text-gray-800 px-2">SFL: Mode</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {renderCreatableSelect('Output Format', 'sflMode.outputFormat', formData.sflMode.outputFormat, handleSFLChange, appConstants.outputFormats, 'outputFormats', 'sflMode', 'outputFormat')}
                {renderCreatableSelect('Length Constraint', 'sflMode.lengthConstraint', formData.sflMode.lengthConstraint, handleSFLChange, appConstants.lengthConstraints, 'lengthConstraints', 'sflMode', 'lengthConstraint')}
                <div className="md:col-span-2"><label className={labelClasses}>Rhetorical Structure</label><input type="text" name="sflMode.rhetoricalStructure" value={formData.sflMode.rhetoricalStructure} onChange={handleSFLChange} className={commonInputClasses}/></div>
                <div className="md:col-span-2"><label className={labelClasses}>Textual Directives</label><input type="text" name="sflMode.textualDirectives" value={formData.sflMode.textualDirectives} onChange={handleSFLChange} className={commonInputClasses}/></div>
              </div>
            </fieldset>

            <div>
                <label htmlFor="exampleOutput" className={labelClasses}>Example Output (Optional)</label>
                <textarea id="exampleOutput" name="exampleOutput" value={formData.exampleOutput || ''} onChange={handleFormChange} rows={3} className={commonInputClasses} />
            </div>
            
            <div>
                <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
                <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleFormChange} rows={2} className={commonInputClasses} />
            </div>

            {saveState.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <XCircleIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{saveState.error}</p>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );

    /**
     * @function renderContent
     * @description A router-like function that renders the content for the current wizard step.
     * @returns {JSX.Element} The UI for the current step.
     * @private
     */
    const renderContent = () => {
        switch (step) {
            case 'input':
                return (
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.text"/>
                        <div>
                            <label htmlFor="goal" className="block text-lg text-gray-700 mb-2">Describe your prompt's goal</label>
                            <textarea
                                id="goal"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g., I want a short, funny poem about a cat who is a senior software engineer."
                                rows={6}
                                className={commonInputClasses}
                                aria-label="Your prompt goal"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Source Document (Optional)</label>
                            <p className="text-xs text-gray-500 mb-2">Attach a text file for stylistic reference. The AI will analyze its style to generate the prompt.</p>
                            {sourceDoc ? (
                                <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md border border-gray-300">
                                <span className="text-sm text-gray-800 truncate pr-2">{sourceDoc.name}</span>
                                <button type="button" onClick={() => setSourceDoc(null)} className="text-red-500 hover:text-red-700 shrink-0" aria-label="Remove source document">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                                </div>
                            ) : (
                                <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center px-3 py-2 bg-white border-2 border-dashed border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                >
                                <PaperClipIcon className="w-5 h-5 mr-2" />
                                Attach Document
                                </button>
                            )}
                        </div>
                         <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleCloseAndReset} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#4A69E2] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A69E2]">Generate SFL Prompt</button>
                        </div>
                    </form>
                );
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                        <div className="spinner mb-4"></div>
                        <p className="text-lg text-gray-800">Generating SFL structure...</p>
                        <p className="text-gray-500 text-sm">This may take a moment.</p>
                    </div>
                );
            case 'refinement':
                return (
                   <div className="space-y-6">
                       {renderRefinementForm()}
                       <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                            <button 
                                type="button" 
                                onClick={handleReset} 
                                disabled={saveState.saving}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Over
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSave} 
                                disabled={saveState.saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#4A69E2] rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {saveState.saving && (
                                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                )}
                                {saveState.saving ? 'Saving...' : 'Save Prompt'}
                            </button>
                       </div>
                   </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-lg font-bold text-red-700 mb-2">Error</h4>
                        <p className="text-red-600 mb-4">{errorMessage}</p>
                        <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Try Again</button>
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
