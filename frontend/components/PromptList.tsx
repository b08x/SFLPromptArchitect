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
import { useAppStore } from '../store/appStore';
import PromptCard from './PromptCard';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

/**
 * @interface PromptListProps
 * @description Defines the props for the `PromptList` component.
 * @property {(prompt: PromptSFL) => void} onViewPrompt - Callback function passed down to each `PromptCard` to handle viewing a prompt's details.
 * @property {(prompt: PromptSFL) => void} onEditPrompt - Callback function passed down to each `PromptCard` to handle editing a prompt.
 * @property {(promptId: string) => void} onDeletePrompt - Callback function passed down to each `PromptCard` to handle deleting a prompt.
 * @property {(prompt: PromptSFL) => void} onExportJSON - Callback function passed down to each `PromptCard` to handle exporting a prompt as JSON.
 * @property {(prompt: PromptSFL) => void} onExportMarkdown - Callback function passed down to each `PromptCard` to handle exporting a prompt as Markdown.
 */
interface PromptListProps {
  onViewPrompt: (prompt: PromptSFL) => void;
  onEditPrompt: (prompt: PromptSFL) => void;
  onDeletePrompt: (promptId: string) => void;
  onExportJSON: (prompt: PromptSFL) => void;
  onExportMarkdown: (prompt: PromptSFL) => void;
}

/**
 * A component that renders a grid of `PromptCard` components.
 * It serves as the main display area for the collection of prompts. If the `prompts` array
 * is empty, it renders a helpful "empty state" message to the user.
 *
 * @param {PromptListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered list of prompts as a grid, or an empty state message.
 */
const PromptList: React.FC<PromptListProps> = ({ onViewPrompt, onEditPrompt, onDeletePrompt, onExportJSON, onExportMarkdown }) => {
  const { getFilteredPrompts } = useAppStore();
  const prompts = getFilteredPrompts();
  if (prompts.length === 0) {
    return (
      <div className="text-center py-10 bg-[#333e48] rounded-lg border border-[#5c6f7e]">
        <ClipboardDocumentListIcon className="w-16 h-16 text-[#95aac0] mx-auto mb-4"/>
        <p className="text-xl text-gray-200 font-semibold">No prompts found.</p>
        <p className="text-sm text-[#95aac0]">Try adjusting your filters or adding a new prompt.</p>
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
          onExportJSON={onExportJSON}
          onExportMarkdown={onExportMarkdown}
        />
      ))}
    </div>
  );
};

export default PromptList;
