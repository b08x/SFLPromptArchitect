import React, { useState, useEffect } from 'react';
import { PromptSFL, SFLField, SFLTenor, SFLMode } from '../types';
import { TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS, INITIAL_PROMPT_SFL } from '../constants';
import ModalShell from './ModalShell';

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: PromptSFL) => void;
  promptToEdit?: PromptSFL | null;
}

const PromptFormModal: React.FC<PromptFormModalProps> = ({ isOpen, onClose, onSave, promptToEdit }) => {
  const [formData, setFormData] = useState<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>(INITIAL_PROMPT_SFL);

  useEffect(() => {
    if (promptToEdit) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, geminiResponse, geminiTestError, isTesting, ...editableData } = promptToEdit;
      setFormData(editableData);
    } else {
      setFormData(INITIAL_PROMPT_SFL);
    }
  }, [promptToEdit, isOpen]);

  const handleChange = <T extends keyof Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'sflField' | 'sflTenor' | 'sflMode' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>>(
    field: T,
    value: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>[T]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSFLChange = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K,
    field: F,
    value: string 
  ) => {
    setFormData(prev => ({
      ...prev,
      [sflType]: {
        ...prev[sflType],
        [field]: value,
      },
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const finalPrompt: PromptSFL = {
      ...formData,
      id: promptToEdit?.id || crypto.randomUUID(),
      createdAt: promptToEdit?.createdAt || now,
      updatedAt: now,
      geminiResponse: promptToEdit?.geminiResponse, 
      geminiTestError: promptToEdit?.geminiTestError,
      isTesting: promptToEdit?.isTesting ?? false,
    };
    onSave(finalPrompt);
    onClose();
  };

  const commonInputClasses = "w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]";
  const labelClasses = "block text-sm font-medium text-[#95aac0] mb-1";

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

  const renderSFLSelectField = <
    K extends 'sflField' | 'sflTenor' | 'sflMode',
    F extends keyof PromptSFL[K],
  >(
    sflType: K, 
    name: F, 
    label: string, 
    options: string[]
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
        {options.map(option => <option key={option} value={option} className="bg-[#212934] text-gray-200">{option}</option>)}
      </select>
    </div>
  );
  
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={promptToEdit ? "Edit Prompt" : "Create New Prompt"} size="3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderTextField('Title', 'title', 'Enter a concise title for the prompt')}
        {renderTextField('Prompt Text', 'promptText', 'Enter the full prompt text here', true)}

        <fieldset className="border border-[#5c6f7e] p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-200 px-2">SFL: Field (What is happening?)</legend>
          <div className="space-y-4 mt-2">
            {renderSFLTextField('sflField', 'topic', 'Topic', 'e.g., Quantum Physics, Recipe Generation')}
            {renderSFLSelectField('sflField', 'taskType', 'Task Type', TASK_TYPES)}
            {renderSFLTextField('sflField', 'domainSpecifics', 'Domain Specifics', 'e.g., Python 3.9, pandas; Italian cuisine', true)}
            {renderSFLTextField('sflField', 'keywords', 'Keywords', 'Comma-separated, e.g., sfl, linguistics, AI')}
          </div>
        </fieldset>

        <fieldset className="border border-[#5c6f7e] p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-200 px-2">SFL: Tenor (Who is taking part?)</legend>
          <div className="space-y-4 mt-2">
            {renderSFLSelectField('sflTenor', 'aiPersona', 'AI Persona', AI_PERSONAS)}
            {renderSFLSelectField('sflTenor', 'targetAudience', 'Target Audience', TARGET_AUDIENCES)}
            {renderSFLSelectField('sflTenor', 'desiredTone', 'Desired Tone', DESIRED_TONES)}
            {renderSFLTextField('sflTenor', 'interpersonalStance', 'Interpersonal Stance', 'e.g., Act as a mentor, Be a collaborative partner', true)}
          </div>
        </fieldset>

        <fieldset className="border border-[#5c6f7e] p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-200 px-2">SFL: Mode (What role is language playing?)</legend>
          <div className="space-y-4 mt-2">
            {renderSFLSelectField('sflMode', 'outputFormat', 'Output Format', OUTPUT_FORMATS)}
            {renderSFLTextField('sflMode', 'rhetoricalStructure', 'Rhetorical Structure', 'e.g., Intro, 3 points, conclusion; Problem-Solution', true)}
            {renderSFLSelectField('sflMode', 'lengthConstraint', 'Length Constraint', LENGTH_CONSTRAINTS)}
            {renderSFLTextField('sflMode', 'textualDirectives', 'Textual Directives', 'e.g., Use active voice, Avoid jargon', true)}
          </div>
        </fieldset>
        
        {renderTextField('Example Output (Optional)', 'exampleOutput', 'Provide an example of a good response', true)}
        {renderTextField('Notes (Optional)', 'notes', 'Your private notes about this prompt', true)}

        <div className="flex justify-end space-x-3 pt-4 border-t border-[#5c6f7e] mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95aac0] focus:ring-offset-[#333e48]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#c36e26] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e2a32d] focus:ring-offset-[#333e48]"
          >
            {promptToEdit ? 'Save Changes' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default PromptFormModal;