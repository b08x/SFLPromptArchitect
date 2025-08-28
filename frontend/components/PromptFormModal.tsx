/**
 * @file PromptFormModal.tsx
 * @description This component provides a modal form for creating and editing SFL prompts.
 * It includes fields for all SFL parameters, a title, notes, and the main prompt text.
 * It also features an AI-powered regeneration capability and allows attaching a source document for stylistic reference.
 *
 * @requires react
 * @requires ../types
 * @requires ../constants
 * @requires ../utils/generateId
 * @requires ./ModalShell
 * @requires ../services/providerService
 * @requires ./icons/SparklesIcon
 * @requires ./icons/PaperClipIcon
 * @requires ./icons/XCircleIcon
 */

import React, { useState, useEffect, useRef } from 'react';
import { PromptSFL } from '../types';
import { INITIAL_PROMPT_SFL } from '../constants';
import { generateId } from '../utils/generateId';
import ModalShell from './ModalShell';
import { regenerateSFLFromSuggestion, getPreferredProvider } from '../services/providerService';
import SparklesIcon from './icons/SparklesIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import XCircleIcon from './icons/XCircleIcon';

/**
 * @interface PromptFormModalProps
 * @description Defines the props for the `PromptFormModal` component.
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {(prompt: PromptSFL) => Promise<void>} onSave - Async callback function to save the prompt data.
 * @property {PromptSFL | null} [promptToEdit] - The prompt object to edit. If `null` or `undefined`, the form operates in creation mode.
 * @property {object} appConstants - An object containing arrays of predefined options for various SFL fields (e.g., taskTypes, aiPersonas).
 * @property {(key: keyof PromptFormModalProps['appConstants'], value: string) => void} onAddConstant - Callback to add a new user-defined option to the application's constants.
 */
interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: PromptSFL) => Promise<void>;
  promptToEdit?: PromptSFL | null;
  appConstants: {
    taskTypes: string[];
    aiPersonas: string[];
    targetAudiences: string[];
    desiredTones: string[];
    outputFormats: string[];
    lengthConstraints: string[];
  };
  onAddConstant: (key: keyof PromptFormModalProps['appConstants'], value: string) => void;
}

/**
 * A comprehensive modal form for creating and editing SFL prompts.
 * It manages the form's state, handles user input for all SFL fields, and provides advanced
 * functionality such as AI-powered regeneration and attaching source documents for context.
 *
 * @param {PromptFormModalProps} props - The props for the component.
 * @returns {JSX.Element} The rendered form modal.
 */
const PromptFormModal: React.FC<PromptFormModalProps> = ({ isOpen, onClose, onSave, promptToEdit, appConstants, onAddConstant }) => {
  /**
   * @state {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>} formData - The main state object for the form, holding all prompt data.
   */
  const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>(INITIAL_PROMPT_SFL);
  
  /**
   * @state {Record<string, string>} newOptionValues - Holds the input values for new, user-defined options for the creatable select fields.
   */
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
  
  /**
   * @state {object} regenState - Manages the state of the AI regeneration feature, including visibility, user input, and loading status.
   */
  const [regenState, setRegenState] = useState({ shown: false, suggestion: '', loading: false });
  
  /**
   * @state {object} saveState - Manages the state of the save operation, including loading status and any error messages.
   */
  const [saveState, setSaveState] = useState({ saving: false, error: '' });
  
  /**
   * @ref {HTMLInputElement} fileInputRef - A ref to a hidden file input for programmatically triggering the file selection dialog.
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * @effect Populates the form with data when `promptToEdit` is provided, or resets to the initial state for a new prompt.
   * This runs whenever the modal is opened or the `promptToEdit` prop changes.
   */
  useEffect(() => {
    if (promptToEdit) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, geminiResponse, geminiTestError, isTesting, ...editableData } = promptToEdit;
      setFormData(editableData);
    } else {
      setFormData(INITIAL_PROMPT_SFL);
    }
     setRegenState({ shown: false, suggestion: '', loading: false });
     setSaveState({ saving: false, error: '' });
  }, [promptToEdit, isOpen]);

  /**
   * @callback handleChange
   * @description A generic handler for updating top-level fields in the `formData` state.
   * @param {T} field - The name of the field to update.
   * @param {Omit<PromptSFL, ...>[T]} value - The new value for the field.
   */
  const handleChange = <T extends keyof Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'sflField' | 'sflTenor' | 'sflMode' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>>(
    field: T,
    value: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>[T]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * @callback handleSFLChange
   * @description A specific handler for updating nested fields within the SFL objects (`sflField`, `sflTenor`, `sflMode`).
   * @param {K} sflType - The top-level SFL category ('sflField', 'sflTenor', 'sflMode').
   * @param {F} field - The specific field within the SFL category to update.
   * @param {*} value - The new value for the field.
   */
  const handleSFLChange = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K,
    field: F,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [sflType]: {
        ...prev[sflType],
        [field]: value,
      },
    }));
  };
  
  /**
   * @callback handleTargetAudienceChange
   * @description Handles changes to the 'targetAudience' checkboxes, adding or removing audiences from the array.
   * @param {string} audience - The audience string to toggle.
   */
  const handleTargetAudienceChange = (audience: string) => {
    const currentAudiences = formData.sflTenor.targetAudience || [];
    const newAudiences = currentAudiences.includes(audience)
      ? currentAudiences.filter(a => a !== audience)
      : [...currentAudiences, audience];
    handleSFLChange('sflTenor', 'targetAudience', newAudiences);
  };

  /**
   * @callback handleAddNewOption
   * @description Handles the submission of a new, user-defined option for a creatable select field.
   * It calls the `onAddConstant` prop to update the global list and then sets the new value in the form.
   * @param {keyof typeof appConstants} constantsKey - The key for the global constants array.
   * @param {K} sflKey - The SFL category key.
   * @param {F} fieldKey - The SFL field key.
   */
  const handleAddNewOption = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K]
  >(constantsKey: keyof typeof appConstants, sflKey: K, fieldKey: F) => {
    const value = newOptionValues[String(fieldKey)];
    if(value && value.trim()){
      onAddConstant(constantsKey, value);
      handleSFLChange(sflKey, fieldKey, value);
      setNewOptionValues(prev => ({...prev, [String(fieldKey)]: ''}));
    }
  };

  /**
   * @callback handleRegeneratePrompt
   * @description Initiates an AI-powered regeneration of the prompt based on the user's suggestion.
   * It calls the `regenerateSFLFromSuggestion` service and updates the entire form with the new data.
   */
  const handleRegeneratePrompt = async () => {
    if (!regenState.suggestion.trim()) return;
    setRegenState(prev => ({ ...prev, loading: true }));
    try {
      const { preferredProvider } = await getPreferredProvider();
      
      const result = await regenerateSFLFromSuggestion(
        formData, 
        regenState.suggestion,
        preferredProvider || undefined
      );
      
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
   * @callback handleFileChange
   * @description Handles the selection of a source document file. Reads the file content
   * and stores it along with the filename in the form state.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({ ...prev, sourceDocument: { name: file.name, content } }));
      };
      reader.readAsText(file);
    }
    if(event.target) event.target.value = '';
  };

  /**
   * @function handleRemoveFile
   * @description Removes the attached source document from the form state.
   */
  const handleRemoveFile = () => {
    setFormData(prev => ({...prev, sourceDocument: undefined }));
  };

  /**
   * @callback handleSubmit
   * @description Handles the form submission. It performs validation, constructs the final
   * `PromptSFL` object with necessary metadata, calls the `onSave` prop, and closes the modal on success.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const now = new Date().toISOString();
      const finalPrompt: PromptSFL = {
        ...formData,
        id: promptToEdit?.id || generateId(),
        createdAt: promptToEdit?.createdAt || now,
        updatedAt: now,
        geminiResponse: promptToEdit?.geminiResponse, 
        geminiTestError: promptToEdit?.geminiTestError,
        isTesting: promptToEdit?.isTesting ?? false,
      };
      
      await onSave(finalPrompt);
      setSaveState({ saving: false, error: '' });
      onClose();
    } catch (error) {
      setSaveState({ 
        saving: false, 
        error: error instanceof Error ? error.message : 'Failed to save prompt' 
      });
    }
  };

  const commonInputClasses = "w-full px-3 py-2 bg-[#333e48] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]";
  const labelClasses = "block text-sm font-medium text-gray-200 mb-1";

  /**
   * @function renderTextField
   * @description A helper function to render a standard text input or textarea field.
   * @returns {JSX.Element}
   * @private
   */
  const renderTextField = (label: string, name: keyof Omit<PromptSFL, 'id'|'createdAt'|'updatedAt'|'sflField'|'sflTenor'|'sflMode' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>, placeholder?: string, isTextArea = false) => (
    <div>
      <label htmlFor={name} className={labelClasses}>{label}</label>
      {isTextArea ? (
        <textarea
          id={name}
          name={name}
          value={String(formData[name] || '')}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={commonInputClasses}
        />
      ) : (
        <input
          type="text"
          id={name}
          name={name}
          value={String(formData[name] || '')}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={placeholder}
          className={commonInputClasses}
        />
      )}
    </div>
  );

  /**
   * @function renderSFLTextField
   * @description A helper function to render a text input or textarea for a nested SFL field.
   * @returns {JSX.Element}
   * @private
   */
  const renderSFLTextField = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K, 
    name: F, 
    label: string, 
    placeholder?: string, 
    isTextArea = false
  ) => (
    <div>
      <label htmlFor={`${sflType}-${String(name)}`} className={labelClasses}>{label}</label>
      {isTextArea ? (
        <textarea
          id={`${sflType}-${String(name)}`}
          name={String(name)}
          value={String(formData[sflType][name] || '')}
          onChange={(e) => handleSFLChange(sflType, name, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={commonInputClasses}
        />
      ) : (
        <input
          type="text"
          id={`${sflType}-${String(name)}`}
          name={String(name)}
          value={String(formData[sflType][name] || '')}
          onChange={(e) => handleSFLChange(sflType, name, e.target.value)}
          placeholder={placeholder}
          className={commonInputClasses}
        />
      )}
    </div>
  );

  /**
   * @function renderCreatableSFLSelectField
   * @description A helper function to render a select dropdown that also allows users to add new options.
   * @returns {JSX.Element}
   * @private
   */
  const renderCreatableSFLSelectField = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K, 
    name: F, 
    label: string, 
    options: string[],
    constantsKey: keyof typeof appConstants
  ) => (
    <div>
      <label htmlFor={`${sflType}-${String(name)}`} className={labelClasses}>{label}</label>
      <select
        id={`${sflType}-${String(name)}`}
        name={String(name)}
        value={String(formData[sflType][name] || '')}
        onChange={(e) => handleSFLChange(sflType, name, e.target.value)}
        className={`${commonInputClasses} appearance-none`}
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <div className="flex items-center space-x-2 mt-2">
        <input
            type="text"
            placeholder="Add new option..."
            value={newOptionValues[String(name)] || ''}
            onChange={e => setNewOptionValues(prev => ({...prev, [String(name)]: e.target.value}))}
            className={`${commonInputClasses} text-sm`}
        />
        <button type="button" onClick={() => handleAddNewOption(constantsKey, sflType, name)} className="px-3 py-2 text-sm bg-[#c36e26] hover:bg-[#c36e26]/90 rounded-md shrink-0 text-gray-200">Add</button>
      </div>
    </div>
  );
  
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={promptToEdit ? "Edit Prompt" : "Create New Prompt"} size="3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.text" />
        {renderTextField('Title', 'title', 'Enter a concise title for the prompt')}
        
        <div>
            <label htmlFor="promptText" className={labelClasses}>Prompt Text</label>
            <textarea
              id="promptText"
              name="promptText"
              value={String(formData['promptText'] || '')}
              onChange={(e) => handleChange('promptText', e.target.value)}
              placeholder="Enter the full prompt text here"
              rows={4}
              className={commonInputClasses}
            />
        </div>

         <div>
          <label className={labelClasses}>Source Document (Optional)</label>
          <p className="text-xs text-[#95aac0] mb-2">Attach a text file for stylistic reference. Its style will be analyzed when using the AI regeneration feature.</p>
          {formData.sourceDocument ? (
            <div className="flex items-center justify-between bg-[#212934] p-2 rounded-md border border-[#5c6f7e]">
              <span className="text-sm text-gray-200 truncate pr-2">{formData.sourceDocument.name}</span>
              <button type="button" onClick={handleRemoveFile} className="text-red-300 hover:text-red-400 shrink-0" aria-label="Remove source document">
                <XCircleIcon className="w-5 h-5"/>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center px-3 py-2 bg-[#212934] border-2 border-dashed border-[#5c6f7e] text-[#95aac0] rounded-md hover:bg-[#333e48] hover:border-[#95aac0] transition-colors"
            >
              <PaperClipIcon className="w-5 h-5 mr-2" />
              Attach Document
            </button>
          )}
        </div>

        <div className="my-2 text-right">
          <button type="button" onClick={() => setRegenState(prev => ({...prev, shown: !prev.shown, suggestion: ''}))} className="text-sm text-[#e2a32d] hover:text-[#e2a32d]/80 flex items-center justify-end">
              <SparklesIcon className="w-5 h-5 mr-1"/> Regenerate Prompt with AI
          </button>
        </div>
        
        {regenState.shown && (
            <div className="space-y-2 p-3 bg-[#212934] rounded-md border border-[#5c6f7e]">
                <label htmlFor="regenSuggestion" className={`${labelClasses} text-gray-200`}>How should this prompt be changed?</label>
                <textarea id="regenSuggestion" value={regenState.suggestion} onChange={e => setRegenState(prev => ({...prev, suggestion: e.target.value}))} rows={2} placeholder="e.g., Make the tone more formal, target it to experts..." className={commonInputClasses} />
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setRegenState({ shown: false, suggestion: '', loading: false })} className="px-3 py-1 text-xs bg-[#333e48] text-gray-200 rounded-md hover:bg-[#5c6f7e]">Cancel</button>
                    <button type="button" onClick={handleRegeneratePrompt} disabled={regenState.loading || !regenState.suggestion.trim()} className="px-3 py-1 text-xs bg-[#c36e26] text-gray-200 rounded-md hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center">
                        {regenState.loading && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>}
                        {regenState.loading ? 'Regenerating...' : 'Regenerate'}
                    </button>
                </div>
            </div>
        )}

        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-200 px-2">SFL: Field (What is happening?)</legend>
          <div className="space-y-4 mt-2">
            {renderSFLTextField('sflField', 'topic', 'Topic', 'e.g., Quantum Physics, Recipe Generation')}
            {renderCreatableSFLSelectField('sflField', 'taskType', 'Task Type', appConstants.taskTypes, 'taskTypes')}
            {renderSFLTextField('sflField', 'domainSpecifics', 'Domain Specifics', 'e.g., Python 3.9, pandas; Italian cuisine', true)}
            {renderSFLTextField('sflField', 'keywords', 'Keywords', 'Comma-separated, e.g., sfl, linguistics, AI')}
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-200 px-2">SFL: Tenor (Who is taking part?)</legend>
          <div className="space-y-4 mt-2">
            {renderCreatableSFLSelectField('sflTenor', 'aiPersona', 'AI Persona', appConstants.aiPersonas, 'aiPersonas')}
            
            <div>
                <label className={labelClasses}>Target Audience</label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto p-2 border border-[#5c6f7e] rounded-md bg-[#212934]">
                    {(appConstants.targetAudiences || []).map(audience => (
                        <div key={audience} className="flex items-center">
                            <input
                                id={`audience-${audience}`}
                                type="checkbox"
                                checked={(formData.sflTenor.targetAudience || []).includes(audience)}
                                onChange={() => handleTargetAudienceChange(audience)}
                                className="h-4 w-4 rounded border-[#5c6f7e] text-[#e2a32d] focus:ring-[#e2a32d] bg-[#333e48]"
                            />
                            <label htmlFor={`audience-${audience}`} className="ml-2 text-sm text-gray-200 select-none">{audience}</label>
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
                    }} className="px-3 py-2 text-sm bg-[#c36e26] hover:bg-[#c36e26]/90 rounded-md shrink-0 text-gray-200">Add</button>
                </div>
            </div>

            {renderCreatableSFLSelectField('sflTenor', 'desiredTone', 'Desired Tone', appConstants.desiredTones, 'desiredTones')}
            {renderSFLTextField('sflTenor', 'interpersonalStance', 'Interpersonal Stance', 'e.g., Act as a mentor, Be a collaborative partner', true)}
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-200 px-2">SFL: Mode (What role is language playing?)</legend>
          <div className="space-y-4 mt-2">
            {renderCreatableSFLSelectField('sflMode', 'outputFormat', 'Output Format', appConstants.outputFormats, 'outputFormats')}
            {renderSFLTextField('sflMode', 'rhetoricalStructure', 'Rhetorical Structure', 'e.g., Intro, 3 points, conclusion; Problem-Solution', true)}
            {renderCreatableSFLSelectField('sflMode', 'lengthConstraint', 'Length Constraint', appConstants.lengthConstraints, 'lengthConstraints')}
            {renderSFLTextField('sflMode', 'textualDirectives', 'Textual Directives', 'e.g., Use active voice, Avoid jargon', true)}
          </div>
        </fieldset>
        
        <div>
            <label htmlFor="exampleOutput" className={labelClasses}>Example Output (Optional)</label>
            <textarea id="exampleOutput" name="exampleOutput" value={formData.exampleOutput || ''} onChange={e => handleChange('exampleOutput', e.target.value)} placeholder="Provide an example of a good response" rows={3} className={commonInputClasses} />
        </div>

        {renderTextField('Notes (Optional)', 'notes', 'Your private notes about this prompt', true)}

        {saveState.error && (
          <div className="bg-red-900/20 border border-red-600 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-300">{saveState.error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saveState.saving}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#333e48] border border-[#5c6f7e] rounded-md hover:bg-[#212934] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e2a32d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveState.saving}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#c36e26] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e2a32d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saveState.saving && (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
            )}
            {saveState.saving 
              ? (promptToEdit ? 'Saving...' : 'Creating...') 
              : (promptToEdit ? 'Save Changes' : 'Create Prompt')
            }
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default PromptFormModal;
