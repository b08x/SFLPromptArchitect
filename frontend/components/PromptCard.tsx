/**
 * @file PromptCard.tsx
 * @description This component renders a single card representing an SFL prompt.
 * It displays key information such as the title, task type, persona, and format,
 * providing a quick, scannable overview. It also includes a dropdown menu with
 * actions like View, Edit, and Delete.
 *
 * @requires react
 * @requires ../types
 * @requires ./icons/EllipsisVerticalIcon
 * @requires ./icons/CodeBracketIcon
 * @requires ./icons/ChatBubbleLeftRightIcon
 * @requires ./icons/DocumentTextIcon
 * @requires ./icons/ArrowsRightLeftIcon
 * @requires ./icons/GlobeAltIcon
 * @requires ./icons/WrenchScrewdriverIcon
 * @requires ./icons/AcademicCapIcon
 */

import React, { useState, useRef, useEffect } from 'react';
import { PromptSFL } from '../types';
import EllipsisVerticalIcon from './icons/EllipsisVerticalIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import GlobeAltIcon from './icons/GlobeAltIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';

/**
 * @interface PromptCardProps
 * @description Defines the props for the `PromptCard` component.
 * @property {PromptSFL} prompt - The SFL prompt object to display.
 * @property {(prompt: PromptSFL) => void} onView - Callback function invoked when the "View" action is selected from the menu.
 * @property {(prompt: PromptSFL) => void} onEdit - Callback function invoked when the "Edit" action is selected from the menu.
 * @property {(promptId: string) => void} onDelete - Callback function invoked when the "Delete" action is selected from the menu.
 */
interface PromptCardProps {
  prompt: PromptSFL;
  onView: (prompt: PromptSFL) => void;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
}

/**
 * A utility function that returns a specific icon component based on the task type string.
 * This helps in visually distinguishing different types of prompts in the UI.
 *
 * @param {string} taskType - The task type from the prompt's SFL Field (e.g., "Code Generation").
 * @returns {React.ReactElement} A React icon component corresponding to the task type.
 * @private
 */
const getTaskIcon = (taskType: string): React.ReactElement => {
    const iconProps = { className: "w-5 h-5" };
    switch (taskType) {
        case 'Explanation': return <ChatBubbleLeftRightIcon {...iconProps} />;
        case 'Code Generation': return <CodeBracketIcon {...iconProps} />;
        case 'Summarization': return <DocumentTextIcon {...iconProps} />;
        case 'Translation': return <GlobeAltIcon {...iconProps} />;
        case 'Code Debugging Assistant': return <WrenchScrewdriverIcon {...iconProps} />;
        case 'JSON Data Transformation': return <ArrowsRightLeftIcon {...iconProps} />;
        case 'Technical Concept Explanation': return <AcademicCapIcon {...iconProps} />;
        default: return <DocumentTextIcon {...iconProps} />;
    }
}

/**
 * A card component that displays a summary of an SFL prompt and provides actions.
 * It shows the prompt's title, a snippet of its text, key SFL parameters (Task, Persona, Format),
 * and associated keywords. An options menu allows the user to view, edit, or delete the prompt.
 *
 * @param {PromptCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered prompt card.
 */
const PromptCard: React.FC<PromptCardProps> = ({ prompt, onView, onEdit, onDelete }) => {
  /**
   * @state {boolean} menuOpen - Manages the visibility of the dropdown actions menu.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  
  /**
   * @ref {HTMLDivElement} menuRef - A ref attached to the menu container to detect clicks outside of it for closing.
   */
  const menuRef = useRef<HTMLDivElement>(null);

  const isTested = !!prompt.geminiResponse;

  /**
   * @constant {Record<string, string>} cardIconColorMapping - A mapping of task types to Tailwind CSS classes for styling the card's icon.
   * @private
   */
  const cardIconColorMapping: Record<string, string> = {
    Explanation: 'text-blue-400 bg-blue-900/20',
    'Code Generation': 'text-green-400 bg-green-900/20',
    Summarization: 'text-purple-400 bg-purple-900/20',
    Translation: 'text-sky-400 bg-sky-900/20',
    'Code Debugging Assistant': 'text-red-400 bg-red-900/20',
    'JSON Data Transformation': 'text-indigo-400 bg-indigo-900/20',
    'Technical Concept Explanation': 'text-[#e2a32d] bg-[#e2a32d]/20',
    default: 'text-[#95aac0] bg-[#333e48]',
  }

  const iconColor = cardIconColorMapping[prompt.sflField.taskType] || cardIconColorMapping.default;

  /**
   * @effect Adds a global click listener to close the actions menu when the user clicks outside of it.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className="bg-[#333e48] shadow-sm rounded-lg p-5 border border-[#5c6f7e] hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${iconColor}`}>
                    {getTaskIcon(prompt.sflField.taskType)}
                </div>
                <h3 className="text-md font-semibold text-gray-200" title={prompt.title}>
                    {prompt.title}
                </h3>
            </div>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="p-1 text-[#95aac0] hover:text-gray-200 rounded-full hover:bg-[#333e48]"
                    aria-label="Options"
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#333e48] rounded-md shadow-lg z-10 border border-[#5c6f7e]">
                    <button onClick={() => { onView(prompt); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#212934]">View Details</button>
                    <button onClick={() => { onEdit(prompt); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#212934]">Edit</button>
                    <button onClick={() => { onDelete(prompt.id); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-900/20">Delete</button>
                    </div>
                )}
            </div>
        </div>

        <p className="text-[#95aac0] text-sm mb-3 line-clamp-2" title={prompt.promptText}>{prompt.promptText}</p>
        
        <div className="space-y-2 text-sm mb-4">
            <div className="flex"><p className="w-16 font-medium text-[#95aac0] shrink-0">Task:</p> <p className="text-gray-200 truncate">{prompt.sflField.taskType}</p></div>
            <div className="flex"><p className="w-16 font-medium text-[#95aac0] shrink-0">Persona:</p> <p className="text-gray-200 truncate">{prompt.sflTenor.aiPersona}</p></div>
            <div className="flex"><p className="w-16 font-medium text-[#95aac0] shrink-0">Format:</p> <p className="text-gray-200 truncate">{prompt.sflMode.outputFormat}</p></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.sflField.keywords.split(',').slice(0, 3).map((keyword) => (
            keyword.trim() && (
              <span key={keyword} className="px-2 py-0.5 text-xs font-medium text-[#95aac0] bg-[#212934] rounded-full">
                #{keyword.trim()}
              </span>
            )
          ))}
        </div>
      </div>
      
      <div className="border-t border-[#5c6f7e] pt-4 flex justify-between items-center text-sm">
        <p className="text-[#95aac0]">Updated {new Date(prompt.updatedAt).toLocaleDateString()}</p>
        {isTested ? (
          <span className="px-2 py-1 text-xs font-semibold text-green-400 bg-green-900/20 rounded-md">Tested</span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold text-amber-400 bg-amber-900/20 rounded-md">Not Tested</span>
        )}
      </div>
    </div>
  );
};

export default PromptCard;
