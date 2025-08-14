/**
 * @file Header.tsx
 * @description This component renders the main application header.
 * It includes the application title and a set of primary action buttons for creating, importing,
 * exporting, and getting help with prompts. It is a stateless component that receives all its
 * functionality via props.
 *
 * @requires react
 * @requires ./icons/PlusIcon
 * @requires ./icons/MagicWandIcon
 * @requires ./icons/ArrowUpTrayIcon
 * @requires ./icons/ArrowDownTrayIcon
 * @requires ./icons/QuestionMarkCircleIcon
 * @requires ./icons/DocumentTextIcon
 */

import React from 'react';
import PlusIcon from './icons/PlusIcon';
import MagicWandIcon from './icons/MagicWandIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';

/**
 * @interface HeaderProps
 * @description Defines the props for the `Header` component.
 * It consists of a collection of callback functions to be triggered by the various action buttons in the header.
 * @property {() => void} onAddNewPrompt - Callback function invoked when the "New Prompt" button is clicked.
 * @property {() => void} onOpenWizard - Callback function invoked when the "Prompt Wizard" button is clicked.
 * @property {() => void} onImportPrompts - Callback function invoked when the "Import Prompts" button is clicked.
 * @property {() => void} onExportAllPrompts - Callback function invoked when the "Export All as JSON" button is clicked.
 * @property {() => void} onExportAllPromptsMarkdown - Callback function invoked when the "Export All as Markdown" button is clicked.
 * @property {() => void} onOpenHelp - Callback function invoked when the "Help Guide" button is clicked.
 */
interface HeaderProps {
  onAddNewPrompt: () => void;
  onOpenWizard: () => void;
  onImportPrompts: () => void;
  onExportAllPrompts: () => void;
  onExportAllPromptsMarkdown: () => void;
  onOpenHelp: () => void;
}

/**
 * The main header component for the application.
 * It displays the application title and provides a set of globally-relevant action buttons
 * for managing the prompt library.
 *
 * @param {HeaderProps} props - The props for the component, containing the necessary event handlers.
 * @returns {JSX.Element} The rendered header element.
 */
const Header: React.FC<HeaderProps> = ({ onAddNewPrompt, onOpenWizard, onImportPrompts, onExportAllPrompts, onExportAllPromptsMarkdown, onOpenHelp }) => {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-[#e2a32d]">SFL Prompt Architect</h1>
      <div className="flex items-center space-x-3">
        <div className="flex space-x-2 border-r border-[#5c6f7e] pr-3 mr-1">
            <button
              onClick={onOpenHelp}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Open help guide"
              title="Help Guide"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onImportPrompts}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Import prompts"
              title="Import Prompts"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onExportAllPrompts}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Export all prompts as JSON"
              title="Export All as JSON"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
             <button
              onClick={onExportAllPromptsMarkdown}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Export all prompts as Markdown"
              title="Export All as Markdown"
            >
              <DocumentTextIcon className="w-5 h-5" />
            </button>
        </div>
        <button
          onClick={onOpenWizard}
          className="bg-[#5c6f7e] hover:bg-opacity-90 text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:ring-offset-2 focus:ring-offset-[#212934]"
          aria-label="Open Prompt Wizard"
        >
          <MagicWandIcon className="w-5 h-5 mr-2" />
          Prompt Wizard
        </button>
        <button
          onClick={onAddNewPrompt}
          className="bg-[#c36e26] hover:bg-opacity-90 text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:ring-offset-2 focus:ring-offset-[#212934]"
          aria-label="Create new prompt"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Prompt
        </button>
      </div>
    </header>
  );
};

export default Header;
