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
 * @description Defines the props for the TopBar component.
 * @property {() => void} onAddNewPrompt - Callback function for the "Create New Prompt" button.
 * @property {() => void} onOpenWizard - Callback function for the "Prompt Wizard" button.
 * @property {string} searchTerm - The current value of the search input.
 * @property {(value: string) => void} onSearchChange - Callback function to handle changes to the search term.
 */
interface TopBarProps {
  onAddNewPrompt: () => void;
  onOpenWizard: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

/**
 * The top bar component containing a search field and primary action buttons.
 *
 * @param {TopBarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered top bar.
 */
const TopBar: React.FC<TopBarProps> = ({ onAddNewPrompt, onOpenWizard, searchTerm, onSearchChange }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="relative w-full max-w-sm">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A69E2] focus:border-[#4A69E2] outline-none"
        />
      </div>
      <div className="flex items-center space-x-4">
          <button
            onClick={onOpenWizard}
            className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <MagicWandIcon className="w-5 h-5" />
            <span>Prompt Wizard</span>
          </button>
          <button
            onClick={onAddNewPrompt}
            className="flex items-center space-x-2 bg-[#4A69E2] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create New Prompt</span>
          </button>
      </div>
    </header>
  );
};

export default TopBar;
