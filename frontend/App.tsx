/**
 * @file App.tsx
 * @description This is the root component of the SFL Prompt Architect application.
 * It manages the main state of the application, including the list of prompts, active modals,
 * filters, and the current page. It orchestrates all the main components like the Sidebar,
 * TopBar, and the main content area.
 *
 * @requires react
 * @requires ./types
 * @requires ./components/Sidebar
 * @requires ./components/TopBar
 * @requires ./components/Stats
 * @requires ./components/PromptList
 * @requires ./components/PromptFormModal
 * @requires ./components/PromptDetailModal
 * @requires ./components/PromptWizardModal
 * @requires ./components/HelpModal
 * @requires ./components/Documentation
 * @requires ./components/lab/PromptLabPage
 * @requires ./services/geminiService
 * @requires ./services/promptApiService
 * @requires ./constants
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PromptSFL, Filters, ModalType } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Stats from './components/Stats';
import PromptList from './components/PromptList';
import PromptFormModal from './components/PromptFormModal';
import PromptDetailModal from './components/PromptDetailModal';
import PromptWizardModal from './components/PromptWizardModal';
import HelpModal from './components/HelpModal';
import Documentation from './components/Documentation';
import PromptLabPage from './components/lab/PromptLabPage';
import { testPromptWithGemini } from './services/geminiService';
import { getPrompts, savePrompt, deletePrompt as apiDeletePrompt } from './services/promptApiService';
import { TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS, POPULAR_TAGS } from './constants';

const initialFilters: Filters = {
  searchTerm: '',
  topic: '',
  taskType: '',
  aiPersona: '',
  outputFormat: '',
};

/**
 * Converts a PromptSFL object into a Markdown string.
 * @param {PromptSFL} prompt - The prompt to convert.
 * @returns {string} The Markdown representation of the prompt.
 */
const promptToMarkdown = (prompt: PromptSFL): string => {
    const { 
        title, updatedAt, promptText, sflField, sflTenor, sflMode, exampleOutput, notes, sourceDocument
    } = prompt;

    const sections = [
        `# ${title || 'Untitled Prompt'}`,
        `**Last Updated:** ${new Date(updatedAt).toLocaleString()}`,
        '---',
        '## Prompt Text',
        '```',
        promptText || '',
        '```',
    ];

    if (sourceDocument) {
        sections.push(
            '---',
            '## Source Document',
            `**Filename:** \`${sourceDocument.name}\``,
            '> This document was used as a stylistic reference during prompt generation.',
            '',
            '<details>',
            '<summary>View Content</summary>',
            '',
            '```',
            sourceDocument.content,
            '```',
            '</details>'
        );
    }

    const keywordsString = sflField.keywords ? `\`${sflField.keywords.split(',').map(k => k.trim()).join('`, `')}\`` : 'N/A';

    sections.push(
        '---',
        '## SFL Metadata',
        '### Field (What is happening?)',
        `- **Topic:** ${sflField.topic || 'N/A'}`,
        `- **Task Type:** ${sflField.taskType || 'N/A'}`,
        `- **Domain Specifics:** ${sflField.domainSpecifics || 'N/A'}`,
        `- **Keywords:** ${keywordsString}`,
        '',
        '### Tenor (Who is taking part?)',
        `- **AI Persona:** ${sflTenor.aiPersona || 'N/A'}`,
        `- **Target Audience:** ${sflTenor.targetAudience.join(', ') || 'N/A'}`,
        `- **Desired Tone:** ${sflTenor.desiredTone || 'N/A'}`,
        `- **Interpersonal Stance:** ${sflTenor.interpersonalStance || 'N/A'}`,
        '',
        '### Mode (What role is language playing?)',
        `- **Output Format:** ${sflMode.outputFormat || 'N/A'}`,
        `- **Rhetorical Structure:** ${sflMode.rhetoricalStructure || 'N/A'}`,
        `- **Length Constraint:** ${sflMode.lengthConstraint || 'N/A'}`,
        `- **Textual Directives:** ${sflMode.textualDirectives || 'N/A'}`,
    );

    if (exampleOutput) {
        sections.push(
            '---',
            '## Example Output',
            '```',
            exampleOutput,
            '```'
        );
    }

    if (notes) {
        sections.push(
            '---',
            '## Notes',
            notes
        );
    }
    
    return sections.join('\n');
};

type Page = 'dashboard' | 'lab' | 'documentation' | 'settings';

/**
 * The main App component.
 * @returns {JSX.Element} The rendered application.
 */
const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptSFL[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptSFL | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const importFileRef = useRef<HTMLInputElement>(null);

  const [appConstants, setAppConstants] = useState({
    taskTypes: TASK_TYPES,
    aiPersonas: AI_PERSONAS,
    targetAudiences: TARGET_AUDIENCES,
    desiredTones: DESIRED_TONES,
    outputFormats: OUTPUT_FORMATS,
    lengthConstraints: LENGTH_CONSTRAINTS,
    popularTags: POPULAR_TAGS,
  });

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const fetchedPrompts = await getPrompts();
        setPrompts(fetchedPrompts);
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };
    fetchPrompts();
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    setActivePage(page);
  }, []);

  const handleAddConstant = useCallback((key: keyof typeof appConstants, value: string) => {
    if (!value || !value.trim()) return;
    const trimmedValue = value.trim();
    setAppConstants(prev => {
        const currentValues = prev[key];
        if (!Array.isArray(currentValues)) return prev;

        const lowerCaseValue = trimmedValue.toLowerCase();
        const existingValues = currentValues.map(v => String(v).toLowerCase());

        if (existingValues.includes(lowerCaseValue)) {
            return prev;
        }
        return {
            ...prev,
            [key]: [...currentValues, trimmedValue]
        };
    });
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedPrompt(null);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };
  
  const handleOpenHelpModal = () => {
    setActiveModal(ModalType.HELP);
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

  const handleSavePrompt = async (prompt: PromptSFL) => {
    try {
      const saved = await savePrompt(prompt);
      setPrompts(prevPrompts => {
        const existingIndex = prevPrompts.findIndex(p => p.id === saved.id);
        if (existingIndex > -1) {
          const updatedPrompts = [...prevPrompts];
          updatedPrompts[existingIndex] = saved;
          return updatedPrompts;
        }
        return [saved, ...prevPrompts].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    } catch (error) {
      console.error("Failed to save prompt:", error);
      throw error;
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if(window.confirm('Are you sure you want to delete this prompt?')){
      try {
        await apiDeletePrompt(promptId);
        setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptId));
        if (selectedPrompt && selectedPrompt.id === promptId) {
            setSelectedPrompt(null);
            handleCloseModal();
        }
      } catch (error) {
        console.error("Failed to delete prompt:", error);
        alert("Failed to delete prompt. Please try again.");
      }
    }
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
      
      const searchFields = [
        p.title,
        p.promptText,
        p.sflField.keywords,
        p.sflField.topic,
        p.sflField.domainSpecifics,
        p.sflTenor.aiPersona,
        p.sflTenor.targetAudience.join(' '),
        p.sflMode.outputFormat
      ];

      const matchesSearchTerm = filters.searchTerm === '' || searchFields.some(field => field && field.toLowerCase().includes(searchTermLower));
      const matchesTaskType = filters.taskType === '' || p.sflField.taskType === filters.taskType;
      const matchesAiPersona = filters.aiPersona === '' || p.sflTenor.aiPersona === filters.aiPersona;
      
      return matchesSearchTerm && matchesTaskType && matchesAiPersona;
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
      const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
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

  const handleExportSinglePromptMarkdown = (promptToExport: PromptSFL) => {
    if (!promptToExport) {
      alert("No prompt selected for export.");
      return;
    }
    try {
      const markdownData = promptToMarkdown(promptToExport);
      const blob = new Blob([markdownData], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      const sanitizedTitle = sanitizeFilename(promptToExport.title || "untitled");
      a.href = url;
      a.download = `sfl-prompt_${sanitizedTitle}_${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting prompt as markdown:", error);
      alert("An error occurred while exporting the prompt as markdown. Please check the console for details.");
    }
  };


  const handleExportAllPrompts = () => {
    if (prompts.length === 0) {
      alert("There are no prompts to export.");
      return;
    }
    try {
      const exportablePrompts = prompts.map(p => {
        const { isTesting, geminiResponse, geminiTestError, ...rest } = p;
        return rest;
      });
      const jsonData = JSON.stringify(exportablePrompts, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sfl-prompt-library_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting prompts:", error);
      alert("An error occurred while exporting prompts. Please check the console for details.");
    }
  };

  const handleExportAllPromptsMarkdown = () => {
    if (prompts.length === 0) {
      alert("There are no prompts to export.");
      return;
    }
    try {
      const allPromptsMarkdown = prompts
        .map(p => promptToMarkdown(p))
        .join('\n\n---\n\n');
        
      const blob = new Blob([allPromptsMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sfl-prompt-library_${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting all prompts as markdown:", error);
      alert("An error occurred while exporting prompts as markdown. Please check the console for details.");
    }
  };

  const handleImportPrompts = () => {
      importFileRef.current?.click();
  };

  const onFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error("File content is not readable.");
              }
              const importedData = JSON.parse(text);

              if (!Array.isArray(importedData)) {
                  throw new Error("Imported file is not a valid prompt array.");
              }

              const isValid = importedData.every(p => p.id && p.title && p.promptText);
              if (!isValid) {
                  throw new Error("Some prompts in the imported file are malformed.");
              }
              const importedPrompts = importedData as PromptSFL[];
              
              setPrompts(prevPrompts => {
                  const promptsMap = new Map(prevPrompts.map(p => [p.id, p]));
                  let newPromptsCount = 0;
                  let updatedPromptsCount = 0;

                  importedPrompts.forEach(importedPrompt => {
                      if (promptsMap.has(importedPrompt.id)) {
                          updatedPromptsCount++;
                      } else {
                          newPromptsCount++;
                      }
                      promptsMap.set(importedPrompt.id, {
                          ...importedPrompt,
                          geminiResponse: undefined,
                          geminiTestError: undefined,
                          isTesting: false,
                      });
                  });
                  alert(`Import successful!\n\nNew prompts: ${newPromptsCount}\nUpdated prompts: ${updatedPromptsCount}`);
                  return Array.from(promptsMap.values());
              });

          } catch (error: any) {
              console.error("Error importing prompts:", error);
              alert(`Import failed: ${error.message}`);
          finally {
              if (event.target) {
                  event.target.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  const renderMainContent = () => {
    switch(activePage) {
        case 'dashboard':
            return (
                <>
                    <Stats totalPrompts={prompts.length}/>
                    <div className="mt-8">
                        <PromptList 
                            prompts={filteredPrompts} 
                            onViewPrompt={handleOpenDetailModal}
                            onEditPrompt={handleOpenEditModal}
                            onDeletePrompt={handleDeletePrompt}
                        />
                    </div>
                </>
            );
        case 'lab':
            return <PromptLabPage prompts={prompts} />;
        case 'documentation':
            return <Documentation />;
        case 'settings':
        default:
             return (
                <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Coming Soon!</h2>
                    <p className="text-gray-500 mt-2">This page is under construction.</p>
                </div>
            );
    }
  }

  return (
    <div className="flex h-screen bg-[#F7FF8FC] font-sans">
      <Sidebar 
        filters={filters}
        onFilterChange={handleFilterChange}
        popularTags={appConstants.popularTags}
        activePage={activePage}
        onNavigate={handleNavigate}
      />
       <input
            type="file"
            ref={importFileRef}
            onChange={onFileImport}
            className="hidden"
            accept="application/json"
        />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          onAddNewPrompt={handleOpenCreateModal}
          onOpenWizard={handleOpenWizard}
          searchTerm={filters.searchTerm}
          onSearchChange={(value) => handleFilterChange('searchTerm', value)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderMainContent()}
        </main>
      </div>

      {activeModal === ModalType.CREATE_EDIT_PROMPT && (
        <PromptFormModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
          promptToEdit={selectedPrompt}
          appConstants={appConstants}
          onAddConstant={handleAddConstant}
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
          onExportPromptMarkdown={handleExportSinglePromptMarkdown}
        />
      )}

      {activeModal === ModalType.WIZARD && (
        <PromptWizardModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
          appConstants={appConstants}
          onAddConstant={handleAddConstant}
        />
      )}

      {activeModal === ModalType.HELP && (
        <HelpModal
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default App;
