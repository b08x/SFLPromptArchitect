
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PromptSFL, Filters, ModalType } from './types';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import PromptList from './components/PromptList';
import PromptFormModal from './components/PromptFormModal';
import PromptDetailModal from './components/PromptDetailModal';
import PromptWizardModal from './components/PromptWizardModal';
import { testPromptWithGemini } from './services/geminiService';

const initialFilters: Filters = {
  searchTerm: '',
  topic: '',
  taskType: '',
  aiPersona: '',
  outputFormat: '',
};

const samplePrompts: PromptSFL[] = [
  {
    id: crypto.randomUUID(),
    title: "Explain Black Holes to a Child",
    promptText: "Explain what a black hole is in simple terms that a 5-year-old can understand. Use an analogy.",
    sflField: { topic: "Astrophysics", taskType: "Explanation", domainSpecifics: "Simple analogy needed", keywords: "space, gravity, stars" },
    sflTenor: { aiPersona: "Friendly Teacher", targetAudience: "Children (5-7 years)", desiredTone: "Simple, Engaging", interpersonalStance: "Patient explainer" },
    sflMode: { outputFormat: "Plain Text", rhetoricalStructure: "Analogy first, then simple explanation", lengthConstraint: "Short Paragraph (~50 words)", textualDirectives: "Use short sentences, avoid jargon" },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    exampleOutput: "Imagine a super-duper vacuum cleaner in space that's so strong it can suck up everything, even light! That's kind of like a black hole."
  },
  {
    id: crypto.randomUUID(),
    title: "Generate Python code for Fibonacci",
    promptText: "Write a Python function to calculate the nth Fibonacci number using recursion.",
    sflField: { topic: "Programming", taskType: "Code Generation", domainSpecifics: "Python, Recursion", keywords: "fibonacci, python, code, algorithm" },
    sflTenor: { aiPersona: "Expert Coder", targetAudience: "Software Developers", desiredTone: "Concise, Technical", interpersonalStance: "Code provider" },
    sflMode: { outputFormat: "Python Code", rhetoricalStructure: "Function definition with docstring", lengthConstraint: "Concise (as needed)", textualDirectives: "Include type hints if possible" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];


const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptSFL[]>(() => {
    const savedPrompts = localStorage.getItem('sflPrompts');
    try {
        return savedPrompts ? JSON.parse(savedPrompts) : samplePrompts;
    } catch (error) {
        console.error("Failed to parse prompts from localStorage", error);
        return samplePrompts;
    }
  });
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptSFL | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    localStorage.setItem('sflPrompts', JSON.stringify(prompts));
  }, [prompts]);

  const handleOpenCreateModal = () => {
    setSelectedPrompt(null);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };

  const handleOpenWizard = () => {
    setActiveModal(ModalType.WIZARD);
  };

  const handleOpenEditModal = (prompt: PromptSFL) => {
    setSelectedPrompt(prompt);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };

  const handleOpenDetailModal = (prompt: PromptSFL) => {
    setSelectedPrompt(prompt);
    setActiveModal(ModalType.VIEW_PROMPT_DETAIL);
  };

  const handleCloseModal = () => {
    setActiveModal(ModalType.NONE);
  };

  const handleSavePrompt = (prompt: PromptSFL) => {
    setPrompts(prevPrompts => {
      const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex > -1) {
        const updatedPrompts = [...prevPrompts];
        updatedPrompts[existingIndex] = prompt;
        return updatedPrompts;
      }
      return [prompt, ...prevPrompts].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    handleCloseModal();
  };

  const handleDeletePrompt = (promptId: string) => {
    setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptId));
    if (selectedPrompt && selectedPrompt.id === promptId) {
        setSelectedPrompt(null);
    }
    handleCloseModal();
  };

  const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearchTerm =
        filters.searchTerm === '' ||
        p.title.toLowerCase().includes(searchTermLower) ||
        p.promptText.toLowerCase().includes(searchTermLower) ||
        (p.sflField.keywords && p.sflField.keywords.toLowerCase().includes(searchTermLower)) ||
        (p.sflField.topic && p.sflField.topic.toLowerCase().includes(searchTermLower)) ||
        (p.sflField.domainSpecifics && p.sflField.domainSpecifics.toLowerCase().includes(searchTermLower)) ||
        (p.sflTenor.aiPersona && p.sflTenor.aiPersona.toLowerCase().includes(searchTermLower)) ||
        (p.sflTenor.targetAudience && p.sflTenor.targetAudience.toLowerCase().includes(searchTermLower)) ||
        (p.sflTenor.desiredTone && p.sflTenor.desiredTone.toLowerCase().includes(searchTermLower)) ||
        (p.sflMode.outputFormat && p.sflMode.outputFormat.toLowerCase().includes(searchTermLower));

      const matchesTopic = filters.topic === '' || (p.sflField.topic && p.sflField.topic.toLowerCase().includes(filters.topic.toLowerCase()));
      const matchesTaskType = filters.taskType === '' || p.sflField.taskType === filters.taskType;
      const matchesAiPersona = filters.aiPersona === '' || p.sflTenor.aiPersona === filters.aiPersona;
      const matchesOutputFormat = filters.outputFormat === '' || p.sflMode.outputFormat === filters.outputFormat;
      
      return matchesSearchTerm && matchesTopic && matchesTaskType && matchesAiPersona && matchesOutputFormat;
    }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [prompts, filters]);

  const handleTestWithGemini = async (promptToTest: PromptSFL, variables: Record<string, string>) => {
    const updatePromptState = (id: string, updates: Partial<PromptSFL>) => {
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        setSelectedPrompt(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    };

    updatePromptState(promptToTest.id, { isTesting: true, geminiResponse: undefined, geminiTestError: undefined });
    
    let finalPromptText = promptToTest.promptText;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      finalPromptText = finalPromptText.replace(regex, variables[key] || '');
    });


    try {
      const responseText = await testPromptWithGemini(finalPromptText);
      updatePromptState(promptToTest.id, { isTesting: false, geminiResponse: responseText, geminiTestError: undefined });
    } catch (error: any) {
      updatePromptState(promptToTest.id, { isTesting: false, geminiTestError: error.message, geminiResponse: undefined });
    }
  };

  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
  };

  const handleExportSinglePrompt = (promptToExport: PromptSFL) => {
    if (!promptToExport) {
      alert("No prompt selected for export.");
      return;
    }
    try {
      const { isTesting, geminiResponse, geminiTestError, ...exportablePrompt } = promptToExport;
      const jsonData = JSON.stringify(exportablePrompt, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      const sanitizedTitle = sanitizeFilename(promptToExport.title || "untitled");
      a.href = url;
      a.download = `sfl-prompt_${sanitizedTitle}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting prompt:", error);
      alert("An error occurred while exporting the prompt. Please check the console for details.");
    }
  };


  return (
    <div className="flex h-screen bg-[#212934] overflow-hidden">
      <aside className="w-80 bg-[#333e48] p-5 shadow-2xl overflow-y-auto flex-shrink-0">
        <FilterControls filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} />
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Header onAddNewPrompt={handleOpenCreateModal} onOpenWizard={handleOpenWizard} />
        <PromptList 
          prompts={filteredPrompts} 
          onViewPrompt={handleOpenDetailModal}
          onEditPrompt={handleOpenEditModal}
          onDeletePrompt={handleDeletePrompt}
        />
      </main>

      {activeModal === ModalType.CREATE_EDIT_PROMPT && (
        <PromptFormModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
          promptToEdit={selectedPrompt}
        />
      )}

      {activeModal === ModalType.VIEW_PROMPT_DETAIL && selectedPrompt && (
         <PromptDetailModal
          isOpen={true}
          onClose={handleCloseModal}
          prompt={selectedPrompt}
          onEdit={handleOpenEditModal}
          onDelete={handleDeletePrompt}
          onTestWithGemini={handleTestWithGemini}
          onExportPrompt={handleExportSinglePrompt}
        />
      )}

      {activeModal === ModalType.WIZARD && (
        <PromptWizardModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
        />
      )}
    </div>
  );
};

export default App;