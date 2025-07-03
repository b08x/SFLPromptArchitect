import React from 'react';
import { PromptSFL } from '../types';
import EyeIcon from './icons/EyeIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

interface PromptCardProps {
  prompt: PromptSFL;
  onView: (prompt: PromptSFL) => void;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-[#333e48] shadow-lg rounded-xl p-6 hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col justify-between border border-[#5c6f7e] hover:border-[#95aac0]">
      <div>
        <h3 className="text-xl font-semibold text-[#e2a32d] mb-2 truncate" title={prompt.title}>{prompt.title}</h3>
        <p className="text-gray-200 text-sm mb-3 line-clamp-2" title={prompt.promptText}>{prompt.promptText}</p>
        <div className="mb-4 space-y-1">
          <p className="text-xs text-[#95aac0]">
            <span className="font-medium text-gray-200">Task:</span> {prompt.sflField.taskType}
          </p>
          <p className="text-xs text-[#95aac0]">
            <span className="font-medium text-gray-200">Persona:</span> {prompt.sflTenor.aiPersona}
          </p>
          <p className="text-xs text-[#95aac0]">
             <span className="font-medium text-gray-200">Format:</span> {prompt.sflMode.outputFormat}
          </p>
        </div>
      </div>
      <div className="border-t border-[#5c6f7e] pt-4 flex justify-end items-center space-x-2">
        <button
          onClick={() => onView(prompt)}
          className="p-2 text-[#95aac0] hover:text-[#e2a32d] transition-colors"
          title="View Details"
          aria-label="View prompt details"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onEdit(prompt)}
          className="p-2 text-[#95aac0] hover:text-[#e2a32d] transition-colors"
          title="Edit Prompt"
          aria-label="Edit prompt"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(prompt.id)}
          className="p-2 text-[#95aac0] hover:text-red-400 transition-colors"
          title="Delete Prompt"
          aria-label="Delete prompt"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PromptCard;