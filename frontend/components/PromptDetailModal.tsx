/**
 * @file PromptDetailModal.tsx
 * @description This component displays the full details of a selected SFL prompt in a modal dialog.
 * It provides a comprehensive, read-only view of all SFL parameters, the prompt text, and any associated metadata.
 * It also includes controls for testing the prompt with Gemini (handling variables), editing, deleting, and exporting the prompt.
 *
 * @requires react
 * @requires ../types
 * @requires ./ModalShell
 * @requires ./icons/SparklesIcon
 * @requires ./icons/PencilIcon
 * @requires ./icons/TrashIcon
 * @requires ./icons/ArrowDownTrayIcon
 * @requires ./icons/DocumentTextIcon
 * @requires ./icons/ClipboardIcon
 */

import React, { useMemo, useState, useEffect } from 'react';
import { PromptSFL } from '../types';
import ModalShell from './ModalShell';
import SparklesIcon from './icons/SparklesIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ClipboardIcon from './icons/ClipboardIcon';

/**
 * @interface PromptDetailModalProps
 * @description Defines the props for the `PromptDetailModal` component.
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {PromptSFL | null} prompt - The prompt object to display. If `null`, the modal will not render.
 * @property {(prompt: PromptSFL) => void} onEdit - Callback to trigger the editing mode for the current prompt.
 * @property {(promptId: string) => void} onDelete - Callback to trigger the deletion of the current prompt.
 * @property {(prompt: PromptSFL, variables: Record<string, string>) => void} onTestWithGemini - Callback to test the prompt with the Gemini API, passing any interpolated variable values.
 * @property {(prompt: PromptSFL) => void} onExportPrompt - Callback to export the prompt as a JSON file.
 * @property {(prompt: PromptSFL) => void} onExportPromptMarkdown - Callback to export the prompt as a Markdown file.
 */
interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptSFL | null;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
  onTestWithGemini: (prompt: PromptSFL, variables: Record<string, string>) => void;
  onExportPrompt: (prompt: PromptSFL) => void;
  onExportPromptMarkdown: (prompt: PromptSFL) => void;
}

/**
 * A small, reusable component to display a single piece of detail (a label and its value).
 * It handles conditional rendering and provides an option for code-like formatting.
 *
 * @param {object} props - The component props.
 * @param {string} props.label - The label for the detail item.
 * @param {string | null} [props.value] - The value to display. If falsy, the component renders nothing.
 * @param {boolean} [props.isCode=false] - If `true`, formats the value in a `<pre>` tag for a code-like appearance.
 * @param {boolean} [props.isEmpty=false] - If `true`, the component will not render, regardless of the value.
 * @returns {JSX.Element | null} The rendered detail item or `null`.
 * @private
 */
const DetailItem: React.FC<{ label: string; value?: string | null; isCode?: boolean; isEmpty?: boolean }> = ({ label, value, isCode, isEmpty }) => {
  if (isEmpty || !value) return null;
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-gray-500 mb-0.5">{label}</h4>
      {isCode ? (
        <pre className="bg-[#212934] p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap break-all border border-[#5c6f7e]">{value}</pre>
      ) : (
        <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">{value}</p>
      )}
    </div>
  );
};

/**
 * A modal component that displays the complete details of an SFL prompt.
 * It organizes all SFL parameters into Field, Tenor, and Mode sections for clarity.
 * It automatically detects `{{variables}}` in the prompt text and provides input fields for them.
 * Users can test the prompt with Gemini, view results or errors, and access other management actions.
 *
 * @param {PromptDetailModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal, or `null` if no prompt is provided or `isOpen` is false.
 */
const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ isOpen, onClose, prompt, onEdit, onDelete, onTestWithGemini, onExportPrompt, onExportPromptMarkdown }) => {
  if (!prompt) return null;

  /**
   * @state {Record<string, string>} variableValues - Stores the current values for any variables found in the prompt text.
   */
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  /**
   * @state {boolean} isDocVisible - Toggles the visibility of the source document's content.
   */
  const [isDocVisible, setDocVisible] = useState(false);
  
  /**
   * @state {boolean} docCopied - A transient state to provide feedback when the source document content is copied.
   */
  const [docCopied, setDocCopied] = useState(false);

  /**
   * @memorized {string[]} variables - A memoized array of unique variable names extracted from the prompt text.
   */
  const variables = useMemo(() => {
    if (!prompt?.promptText) return [];
    const regex = /{{\s*(\w+)\s*}}/g;
    const matches = prompt.promptText.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(v => v.replace(/{{\s*|\s*}}/g, '')))];
  }, [prompt?.promptText]);

  /**
   * @effect Resets the state of the modal (variable values, document visibility) whenever it is opened or the prompt changes.
   */
  useEffect(() => {
    if (isOpen && prompt) {
      const initialValues: Record<string, string> = {};
      variables.forEach(v => {
        initialValues[v] = '';
      });
      setVariableValues(initialValues);
      setDocVisible(false);
      setDocCopied(false);
    }
  }, [isOpen, prompt, variables]);

  /**
   * @callback handleVariableChange
   * @description Updates the state for a single prompt variable.
   * @param {string} variableName - The name of the variable to update.
   * @param {string} value - The new value for the variable.
   */
  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [variableName]: value }));
  };
  
  /**
   * @callback handleCopyDocContent
   * @description Copies the content of the attached source document to the clipboard and provides user feedback.
   */
  const handleCopyDocContent = () => {
    if (prompt?.sourceDocument?.content) {
      navigator.clipboard.writeText(prompt.sourceDocument.content);
      setDocCopied(true);
      setTimeout(() => setDocCopied(false), 2000);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={prompt.title} size="4xl">
      <div className="space-y-6 text-gray-800">
        <DetailItem label="Prompt Text" value={prompt.promptText} isCode />

        {prompt.sourceDocument && (
            <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-500 mb-0.5">Source Document</h4>
                <div className="flex items-center justify-between bg-[#212934] p-3 rounded-md text-sm border border-[#5c6f7e]">
                    <span className="italic">{prompt.sourceDocument.name}</span>
                    <button onClick={() => setDocVisible(!isDocVisible)} className="text-xs font-semibold text-[#4A69E2] hover:underline">
                        {isDocVisible ? 'Hide Content' : 'View Content'}
                    </button>
                </div>
                {isDocVisible && (
                    <div className="relative mt-2">
                        <pre className="bg-[#212934] p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap break-all max-h-48 overflow-y-auto border border-[#5c6f7e]">
                           {prompt.sourceDocument.content}
                        </pre>
                        <button onClick={handleCopyDocContent} className="absolute top-2 right-2 p-1.5 bg-[#333e48] rounded-md text-[#95aac0] hover:text-gray-200 transition-colors border border-[#5c6f7e]">
                           {docCopied ? <span className="text-xs">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1 border-gray-200">Field</h3>
            <DetailItem label="Topic" value={prompt.sflField.topic} />
            <DetailItem label="Task Type" value={prompt.sflField.taskType} />
            <DetailItem label="Domain Specifics" value={prompt.sflField.domainSpecifics} />
            <DetailItem label="Keywords" value={prompt.sflField.keywords} />
          </section>

          <section className="border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1 border-gray-200">Tenor</h3>
            <DetailItem label="AI Persona" value={prompt.sflTenor.aiPersona} />
            <DetailItem label="Target Audience" value={prompt.sflTenor.targetAudience.join(', ')} />
            <DetailItem label="Desired Tone" value={prompt.sflTenor.desiredTone} />
            <DetailItem label="Interpersonal Stance" value={prompt.sflTenor.interpersonalStance} />
          </section>

          <section className="border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1 border-gray-200">Mode</h3>
            <DetailItem label="Output Format" value={prompt.sflMode.outputFormat} />
            <DetailItem label="Rhetorical Structure" value={prompt.sflMode.rhetoricalStructure} />
            <DetailItem label="Length Constraint" value={prompt.sflMode.lengthConstraint} />
            <DetailItem label="Textual Directives" value={prompt.sflMode.textualDirectives} />
          </section>
        </div>
        
        <DetailItem label="Example Output" value={prompt.exampleOutput} isEmpty={!prompt.exampleOutput} isCode/>
        <DetailItem label="Notes" value={prompt.notes} isEmpty={!prompt.notes} />
        
        <div className="mt-3">
            <p className="text-xs text-gray-400">Created: {new Date(prompt.createdAt).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Last Updated: {new Date(prompt.updatedAt).toLocaleString()}</p>
        </div>

        {variables.length > 0 && (
          <section className="space-y-4 border border-[#5c6f7e] p-4 rounded-lg bg-[#212934]/50">
            <h3 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1 border-gray-200">Prompt Variables</h3>
            <div className="space-y-4">
              {variables.map((varName) => (
                <div key={varName}>
                  <label htmlFor={`var-${varName}`} className="block text-sm font-medium text-gray-600 mb-1">{`{{${varName}}}`}</label>
                  <textarea
                    id={`var-${varName}`}
                    value={variableValues[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Enter value for ${varName}...`}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#333e48] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {prompt.isTesting && (
          <div className="my-4 p-4 border border-blue-600 rounded-md bg-blue-900/20 flex items-center justify-center">
            <div className="spinner"></div>
            <p className="ml-3 text-blue-700">Testing with Gemini...</p>
          </div>
        )}

        {prompt.geminiResponse && (
          <div className="my-4">
            <h3 className="text-md font-semibold text-green-700 mb-2">Gemini Response:</h3>
            <pre className="bg-green-50 p-4 rounded-md text-sm text-green-800 whitespace-pre-wrap break-all border border-green-200">{prompt.geminiResponse}</pre>
          </div>
        )}

        {prompt.geminiTestError && (
          <div className="my-4">
            <h3 className="text-md font-semibold text-red-700 mb-2">Gemini Test Error:</h3>
            <pre className="bg-red-50 p-4 rounded-md text-sm text-red-800 whitespace-pre-wrap break-all border border-red-200">{prompt.geminiTestError}</pre>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={() => onExportPrompt(prompt)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            aria-label="Export this prompt as JSON"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2"/> Export JSON
          </button>
          <button
            onClick={() => onExportPromptMarkdown(prompt)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            aria-label="Export this prompt as Markdown"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2"/> Export MD
          </button>
          <button
            onClick={() => onTestWithGemini(prompt, variableValues)}
            disabled={prompt.isTesting}
            className="px-3 py-2 text-sm font-medium text-white bg-[#4A69E2] rounded-md hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <SparklesIcon className="w-5 h-5 mr-2"/>
            {prompt.isTesting ? 'Testing...' : 'Test with Gemini'}
          </button>
          <button
            onClick={() => { onEdit(prompt); onClose(); }}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
          >
           <PencilIcon className="w-5 h-5 mr-2"/> Edit
          </button>
          <button
            onClick={() => { if(window.confirm('Are you sure you want to delete this prompt?')) { onDelete(prompt.id); onClose(); }}}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
          >
           <TrashIcon className="w-5 h-5 mr-2"/> Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default PromptDetailModal;
