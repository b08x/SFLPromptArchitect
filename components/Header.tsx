
import React from 'react';
import PlusIcon from './icons/PlusIcon';
import MagicWandIcon from './icons/MagicWandIcon';

interface HeaderProps {
  onAddNewPrompt: () => void;
  onOpenWizard: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNewPrompt, onOpenWizard }) => {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-[#e2a32d]">SFL Prompt Architect</h1>
      <div className="flex space-x-3">
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