import React from 'react';
import { PromptSFL } from '../types';
import PromptCard from './PromptCard';

interface PromptListProps {
  prompts: PromptSFL[];
  onViewPrompt: (prompt: PromptSFL) => void;
  onEditPrompt: (prompt: PromptSFL) => void;
  onDeletePrompt: (promptId: string) => void;
}

const PromptList: React.FC<PromptListProps> = ({ prompts, onViewPrompt, onEditPrompt, onDeletePrompt }) => {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#5c6f7e] mx-auto mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-xl text-[#95aac0]">No prompts found.</p>
        <p className="text-sm text-[#5c6f7e]">Try adjusting your filters or adding a new prompt.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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