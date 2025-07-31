/**
 * @file PromptCard.tsx
 * @description This component renders a single card representing an SFL prompt.
 * It displays key information such as the title, task type, persona, and format.
 * It also includes a dropdown menu with actions like View, Edit, and Delete.
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
 * @description Defines the props for the PromptCard component.
 * @property {PromptSFL} prompt - The SFL prompt object to display.
 * @property {(prompt: PromptSFL) => void} onView - Callback function when the "View" action is selected.
 * @property {(prompt: PromptSFL) => void} onEdit - Callback function when the "Edit" action is selected.
 * @property {(promptId: string) => void} onDelete - Callback function when the "Delete" action is selected.
 */
interface PromptCardProps {
  prompt: PromptSFL;
  onView: (prompt: PromptSFL) => void;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
}

/**
 * Returns a specific icon component based on the task type string.
 * @param {string} taskType - The task type from the prompt's SFL Field.
 * @returns {JSX.Element} A React icon component.
 */
const getTaskIcon = (taskType: string): JSX.Element => {
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
 * It shows the prompt's title, text snippet, key SFL parameters, and keywords.
 * An options menu allows the user to view, edit, or delete the prompt.
 *
 * @param {PromptCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered prompt card.
 */
const PromptCard: React.FC<PromptCardProps> = ({ prompt, onView, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isTested = !!prompt.geminiResponse;

  const cardIconColorMapping: Record<string, string> = {
    Explanation: 'text-blue-500 bg-blue-100',
    'Code Generation': 'text-green-500 bg-green-100',
    Summarization: 'text-purple-500 bg-purple-100',
    Translation: 'text-sky-500 bg-sky-100',
    'Code Debugging Assistant': 'text-red-500 bg-red-100',
    'JSON Data Transformation': 'text-indigo-500 bg-indigo-100',
    'Technical Concept Explanation': 'text-amber-500 bg-amber-100',
    default: 'text-gray-500 bg-gray-100',
  }

  const iconColor = cardIconColorMapping[prompt.sflField.taskType] || cardIconColorMapping.default;

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
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${iconColor}`}>
                    {getTaskIcon(prompt.sflField.taskType)}
                </div>
                <h3 className="text-md font-semibold text-gray-800" title={prompt.title}>
                    {prompt.title}
                </h3>
            </div>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
                    aria-label="Options"
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <button onClick={() => { onView(prompt); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</button>
                    <button onClick={() => { onEdit(prompt); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</button>
                    <button onClick={() => { onDelete(prompt.id); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                )}
            </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={prompt.promptText}>{prompt.promptText}</p>
        
        <div className="space-y-2 text-sm mb-4">
            <div className="flex"><p className="w-16 font-medium text-gray-500 shrink-0">Task:</p> <p className="text-gray-700 truncate">{prompt.sflField.taskType}</p></div>
            <div className="flex"><p className="w-16 font-medium text-gray-500 shrink-0">Persona:</p> <p className="text-gray-700 truncate">{prompt.sflTenor.aiPersona}</p></div>
            <div className="flex"><p className="w-16 font-medium text-gray-500 shrink-0">Format:</p> <p className="text-gray-700 truncate">{prompt.sflMode.outputFormat}</p></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.sflField.keywords.split(',').slice(0, 3).map((keyword) => (
            keyword.trim() && (
              <span key={keyword} className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                #{keyword.trim()}
              </span>
            )
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-sm">
        <p className="text-gray-500">Updated {new Date(prompt.updatedAt).toLocaleDateString()}</p>
        {isTested ? (
          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Tested</span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-md">Not Tested</span>
        )}
      </div>
    </div>
  );
};

export default PromptCard;