
import React, { useMemo, useState, useEffect } from 'react';
import { PromptSFL } from '../types';
import ModalShell from './ModalShell';
import SparklesIcon from './icons/SparklesIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon'; // Added for export

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptSFL | null;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
  onTestWithGemini: (prompt: PromptSFL, variables: Record<string, string>) => void;
  onExportPrompt: (prompt: PromptSFL) => void; // Added prop for exporting
}

const DetailItem: React.FC<{ label: string; value?: string | null; isCode?: boolean; isEmpty?: boolean }> = ({ label, value, isCode, isEmpty }) => {
  if (isEmpty || !value) return null;
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-[#95aac0] mb-0.5">{label}</h4>
      {isCode ? (
        <pre className="bg-[#212934] p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap break-all">{value}</pre>
      ) : (
        <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">{value}</p>
      )}
    </div>
  );
};


const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ isOpen, onClose, prompt, onEdit, onDelete, onTestWithGemini, onExportPrompt }) => {
  if (!prompt) return null;

  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const variables = useMemo(() => {
    if (!prompt?.promptText) return [];
    const regex = /{{\s*(\w+)\s*}}/g;
    const matches = prompt.promptText.match(regex);
    if (!matches) return [];
    // Deduplicate and clean
    return [...new Set(matches.map(v => v.replace(/{{\s*|\s*}}/g, '')))];
  }, [prompt?.promptText]);

  // Reset variable values when the prompt changes or modal opens
  useEffect(() => {
    if (isOpen && prompt) {
      const initialValues: Record<string, string> = {};
      variables.forEach(v => {
        initialValues[v] = '';
      });
      setVariableValues(initialValues);
    }
  }, [isOpen, prompt, variables]);

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [variableName]: value }));
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={prompt.title} size="4xl">
      <div className="space-y-6">
        <DetailItem label="Prompt Text" value={prompt.promptText} isCode />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-200 mb-2 border-b pb-1 border-[#5c6f7e]">Field</h3>
            <DetailItem label="Topic" value={prompt.sflField.topic} />
            <DetailItem label="Task Type" value={prompt.sflField.taskType} />
            <DetailItem label="Domain Specifics" value={prompt.sflField.domainSpecifics} />
            <DetailItem label="Keywords" value={prompt.sflField.keywords} />
          </section>

          <section className="border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-200 mb-2 border-b pb-1 border-[#5c6f7e]">Tenor</h3>
            <DetailItem label="AI Persona" value={prompt.sflTenor.aiPersona} />
            <DetailItem label="Target Audience" value={prompt.sflTenor.targetAudience} />
            <DetailItem label="Desired Tone" value={prompt.sflTenor.desiredTone} />
            <DetailItem label="Interpersonal Stance" value={prompt.sflTenor.interpersonalStance} />
          </section>

          <section className="border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-200 mb-2 border-b pb-1 border-[#5c6f7e]">Mode</h3>
            <DetailItem label="Output Format" value={prompt.sflMode.outputFormat} />
            <DetailItem label="Rhetorical Structure" value={prompt.sflMode.rhetoricalStructure} />
            <DetailItem label="Length Constraint" value={prompt.sflMode.lengthConstraint} />
            <DetailItem label="Textual Directives" value={prompt.sflMode.textualDirectives} />
          </section>
        </div>
        
        <DetailItem label="Example Output" value={prompt.exampleOutput} isEmpty={!prompt.exampleOutput} isCode/>
        <DetailItem label="Notes" value={prompt.notes} isEmpty={!prompt.notes} />
        
        <div className="mt-3">
            <p className="text-xs text-[#5c6f7e]">Created: {new Date(prompt.createdAt).toLocaleString()}</p>
            <p className="text-xs text-[#5c6f7e]">Last Updated: {new Date(prompt.updatedAt).toLocaleString()}</p>
        </div>

        {variables.length > 0 && (
          <section className="space-y-4 border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-200 mb-2 border-b pb-1 border-[#5c6f7e]">Prompt Variables</h3>
            <div className="space-y-4">
              {variables.map((varName) => (
                <div key={varName}>
                  <label htmlFor={`var-${varName}`} className="block text-sm font-medium text-[#95aac0] mb-1">{`{{${varName}}}`}</label>
                  <textarea
                    id={`var-${varName}`}
                    value={variableValues[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Enter value for ${varName}...`}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {prompt.isTesting && (
          <div className="my-4 p-4 border border-[#e2a32d]/50 rounded-md bg-[#e2a32d]/10 flex items-center justify-center">
            <div className="spinner"></div>
            <p className="ml-3 text-[#e2a32d]">Testing with Gemini...</p>
          </div>
        )}

        {prompt.geminiResponse && (
          <div className="my-4">
            <h3 className="text-md font-semibold text-green-400 mb-2">Gemini Response:</h3>
            <pre className="bg-green-900/30 p-4 rounded-md text-sm text-green-300 whitespace-pre-wrap break-all border border-green-700">{prompt.geminiResponse}</pre>
          </div>
        )}

        {prompt.geminiTestError && (
          <div className="my-4">
            <h3 className="text-md font-semibold text-red-300 mb-2">Gemini Test Error:</h3>
            <pre className="bg-red-900/30 p-4 rounded-md text-sm text-red-300 whitespace-pre-wrap break-all border border-red-700">{prompt.geminiTestError}</pre>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-[#5c6f7e] mt-6">
          <button
            onClick={() => onExportPrompt(prompt)}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95aac0] focus:ring-offset-[#333e48] flex items-center"
            aria-label="Export this prompt"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2"/> Export
          </button>
          <button
            onClick={() => onTestWithGemini(prompt, variableValues)}
            disabled={prompt.isTesting}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#c36e26] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e2a32d] focus:ring-offset-[#333e48] disabled:bg-[#c36e26]/50 disabled:cursor-not-allowed flex items-center"
          >
            <SparklesIcon className="w-5 h-5 mr-2"/>
            {prompt.isTesting ? 'Testing...' : 'Test with Gemini'}
          </button>
          <button
            onClick={() => { onEdit(prompt); onClose(); }}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95aac0] focus:ring-offset-[#333e48] flex items-center"
          >
           <PencilIcon className="w-5 h-5 mr-2"/> Edit
          </button>
          <button
            onClick={() => { if(window.confirm('Are you sure you want to delete this prompt?')) { onDelete(prompt.id); onClose(); }}}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-[#333e48] flex items-center"
          >
           <TrashIcon className="w-5 h-5 mr-2"/> Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#5c6f7e] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95aac0] focus:ring-offset-[#333e48]"
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default PromptDetailModal;