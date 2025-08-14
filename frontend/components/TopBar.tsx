/**
 * @file TopBar.tsx
 * @description This component renders the top bar of the application's main content area.
 * It includes a search input field and primary action buttons for creating a new prompt
 * manually or using the Prompt Wizard.
 *
 * @requires react
 * @requires ./icons/MagnifyingGlassIcon
 * @requires ./icons/PlusIcon
 * @requires ./icons/MagicWandIcon
 */

import React from 'react';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import PlusIcon from './icons/PlusIcon';
import MagicWandIcon from './icons/MagicWandIcon';

/**
 * @interface TopBarProps
 * @description Defines the props for the `TopBar` component.
 * @property {() => void} onAddNewPrompt - Callback function invoked when the "Create New Prompt" button is clicked.
 * @property {() => void} onOpenWizard - Callback function invoked when the "Prompt Wizard" button is clicked.
 * @property {string} searchTerm - The current value of the search input, making it a controlled component.
 * @property {(value: string) => void} onSearchChange - Callback function to handle changes to the search term, lifting the state up.
 */
interface TopBarProps {
  onAddNewPrompt: () => void;
  onOpenWizard: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

/**
 * The top bar component that sits above the main content area.
 * It provides a persistent search field and the primary "create" actions for prompts.
 *
 * @param {TopBarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered top bar header element.
 */
const TopBar: React.FC<TopBarProps> = ({ onAddNewPrompt, onOpenWizard, searchTerm, onSearchChange }) => {
  return (
    <header className="bg-[#333e48]/80 backdrop-blur-lg border-b border-[#5c6f7e] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="relative w-full max-w-sm">
        <MagnifyingGlassIcon className="w-5 h-5 text-[#95aac0] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#333e48] border border-[#5c6f7e] rounded-lg text-sm text-gray-200 placeholder-[#95aac0] focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] outline-none"
          aria-label="Search prompts"
        />
      </div>
      <div className="flex items-center space-x-4">
          <button
            onClick={onOpenWizard}
            className="flex items-center space-x-2 bg-[#333e48] text-gray-200 border border-[#5c6f7e] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#333e48]/80 transition-colors shadow-sm"
          >
            <MagicWandIcon className="w-5 h-5" />
            <span>Prompt Wizard</span>
          </button>
          <button
            onClick={onAddNewPrompt}
            className="flex items-center space-x-2 bg-[#c36e26] text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create New Prompt</span>
          </button>
      </div>
    </header>
  );
};

export default TopBar;