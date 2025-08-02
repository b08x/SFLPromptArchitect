/**
 * @file PromptList.tsx
 * @description This component is responsible for rendering a list of SFL prompts.
 * It takes an array of prompt objects and maps each one to a `PromptCard` component,
 * arranging them in a responsive grid. If the list of prompts is empty, it displays a
 * user-friendly message indicating that no prompts were found.
 *
 * @requires react
 * @requires ../types
 * @requires ./PromptCard
 * @requires ./icons/ClipboardDocumentListIcon
 */

import React from 'react';
import { PromptSFL } from '../types';
import PromptCard from './PromptCard';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

/**
 * @interface PromptListProps
 * @description Defines the props for the `PromptList` component.
 * @property {PromptSFL[]} prompts - An array of SFL prompt objects to be displayed.
 * @property {(prompt: PromptSFL) => void} onViewPrompt - Callback function passed down to each `PromptCard` to handle viewing a prompt's details.
 * @property {(prompt: PromptSFL) => void} onEditPrompt - Callback function passed down to each `PromptCard` to handle editing a prompt.
 * @property {(promptId: string) => void} onDeletePrompt - Callback function passed down to each `PromptCard` to handle deleting a prompt.
 */
interface PromptListProps {
  prompts: PromptSFL[];
  onViewPrompt: (prompt: PromptSFL) => void;
  onEditPrompt: (prompt: PromptSFL) => void;
  onDeletePrompt: (promptId: string) => void;
}

/**
 * A component that renders a grid of `PromptCard` components.
 * It serves as the main display area for the collection of prompts. If the `prompts` array
 * is empty, it renders a helpful "empty state" message to the user.
 *
 * @param {PromptListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered list of prompts as a grid, or an empty state message.
 */
const PromptList: React.FC<PromptListProps> = ({ prompts, onViewPrompt, onEditPrompt, onDeletePrompt }) => {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
        <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
        <p className="text-xl text-gray-700 font-semibold">No prompts found.</p>
        <p className="text-sm text-gray-500">Try adjusting your filters or adding a new prompt.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {prompts.map(prompt => (
        <PromptCard 
          key={prompt.id} 
          prompt={prompt} 
          onView={onViewPrompt}
          onEdit={onEditPrompt}
          onDelete={onDeletePrompt}
        />
      ))}
    </div>
  );
};

export default PromptList;
