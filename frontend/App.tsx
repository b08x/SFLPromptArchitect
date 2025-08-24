/**
 * @file App.tsx
 * @description This is the root component of the SFL Prompt Studio application.
 * It serves as the main controller, managing the application's core state, including the list of prompts,
 * active modals, filters, and the current page. It orchestrates all the main components like the Sidebar,
 * TopBar, and the main content area, and wires up all the event handling logic for prompt management,
 * navigation, and interaction with AI services.
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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PromptSFL, ModalType } from './types';
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
import ProviderSetupPage from './components/settings/ProviderSetupPage';
import AuthGuard from './components/AuthGuard';
import { testPromptWithGemini } from './services/geminiService';
import { useProviderValidation } from './hooks/useProviderValidation';
import { useAppStore } from './store/appStore';


/**
 * Converts a `PromptSFL` object into a well-formatted Markdown string.
 * This is used for exporting prompts in a human-readable format.
 *
 * @param {PromptSFL} prompt - The prompt object to convert.
 * @returns {string} The Markdown representation of the prompt.
 * @private
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
            `**Filename:** \`${sourceDocument.name}\`
`,            '> This document was used as a stylistic reference during prompt generation.',
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

/**
 * @typedef {'dashboard' | 'lab' | 'documentation' | 'settings'}
 * @description Represents the possible main pages the user can navigate to.
 */
type Page = 'dashboard' | 'lab' | 'documentation' | 'settings';

/**
 * The main `App` component. It acts as the root of the application,
 * managing state, handling side effects, and composing the UI from smaller components.
 *
 * @returns {JSX.Element} The rendered application UI.
 */
const App: React.FC = () => {
  /**
   * @hook useProviderValidation - Manages AI provider validation and routing
   */
  const {
    isReady: providersReady,
    isLoading: providersLoading,
    error: providerError,
    requiresSetup,
    checkSetupComplete,
    refresh: refreshProviders,
  } = useProviderValidation();

  /**
   * @hook useAppStore - Access to centralized application state and actions
   */
  const {
    prompts,
    filters,
    activePage,
    appConstants,
    fetchPrompts,
    updatePrompt,
    deletePrompt,
    setFilter,
    setPage,
    addConstant,
    getFilteredPrompts
  } = useAppStore();

  /**
   * @state {ModalType} activeModal - The type of the currently active modal, or `ModalType.NONE` if no modal is open.
   */
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  
  /**
   * @state {PromptSFL | null} selectedPrompt - The prompt that is currently selected for viewing or editing.
   */
  const [selectedPrompt, setSelectedPrompt] = useState<PromptSFL | null>(null);
  
  /**
   * @state {boolean} hasUserNavigated - Tracks if user has manually navigated to prevent auto-redirects
   */
  const [hasUserNavigated, setHasUserNavigated] = useState<boolean>(false);
  
  /**
   * @ref {HTMLInputElement} importFileRef - A ref to a hidden file input element, used to trigger the file import dialog programmatically.
   */
  const importFileRef = useRef<HTMLInputElement>(null);

  /**
   * @effect Handles routing based on provider validation status
   * Only auto-redirects on initial load, not after manual navigation
   */
  useEffect(() => {
    if (!providersLoading) {
      if (requiresSetup) {
        setPage('settings');
      } else if (activePage === 'settings' && providersReady && !hasUserNavigated) {
        // Only redirect to dashboard if this is initial load (user hasn't manually navigated)
        setPage('dashboard');
      }
    }
  }, [providersLoading, requiresSetup, providersReady, activePage, hasUserNavigated, setPage]);

  /**
   * @effect Fetches the initial list of prompts from the API when providers are ready.
   */
  useEffect(() => {
    if (providersReady) {
      fetchPrompts();
    }
  }, [providersReady, fetchPrompts]);

  /**
   * @callback handleNavigate
   * @description Handles navigation between the main pages of the application.
   * Also checks provider setup when navigating to non-settings pages.
   * @param {Page} page - The page to navigate to.
   */
  const handleNavigate = useCallback(async (page: Page) => {
    // Mark that user has manually navigated to prevent auto-redirects
    setHasUserNavigated(true);
    
    // If user tries to navigate away from settings, check if setup is complete
    if (page !== 'settings' && requiresSetup) {
      const setupComplete = await checkSetupComplete();
      if (!setupComplete) {
        // Redirect to settings if setup is not complete
        setPage('settings');
        return;
      }
    }
    setPage(page);
  }, [requiresSetup, checkSetupComplete, setPage]);


  /**
   * @function handleOpenCreateModal
   * @description Opens the modal for creating a new prompt.
   */
  const handleOpenCreateModal = () => {
    setSelectedPrompt(null);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };
  
  /**
   * @function handleOpenHelpModal
   * @description Opens the help guide modal.
   */
  const handleOpenHelpModal = () => {
    setActiveModal(ModalType.HELP);
  };

  /**
   * @function handleOpenWizard
   * @description Opens the prompt creation wizard modal.
   */
  const handleOpenWizard = () => {
    setActiveModal(ModalType.WIZARD);
  };

  /**
   * @function handleOpenEditModal
   * @description Opens the modal to edit an existing prompt.
   * @param {PromptSFL} prompt - The prompt to be edited.
   */
  const handleOpenEditModal = (prompt: PromptSFL) => {
    setSelectedPrompt(prompt);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };

  /**
   * @function handleOpenDetailModal
   * @description Opens the modal to view the full details of a prompt.
   * @param {PromptSFL} prompt - The prompt to be viewed.
   */
  const handleOpenDetailModal = (prompt: PromptSFL) => {
    setSelectedPrompt(prompt);
    setActiveModal(ModalType.VIEW_PROMPT_DETAIL);
  };

  /**
   * @function handleCloseModal
   * @description Closes any currently active modal.
   */
  const handleCloseModal = () => {
    setActiveModal(ModalType.NONE);
  };

  /**
   * @callback handleSavePrompt
   * @description Handles saving a new or updated prompt using the store actions.
   * @param {PromptSFL} prompt - The prompt to be saved.
   * @throws {Error} Propagates any errors from the store action.
   */
  const handleSavePrompt = async (prompt: PromptSFL) => {
    try {
      await updatePrompt(prompt);
    } catch (error) {
      console.error("Failed to save prompt:", error);
      throw error;
    }
  };

  /**
   * @callback handleDeletePrompt
   * @description Handles the deletion of a prompt using the store action.
   * @param {string} promptId - The ID of the prompt to delete.
   */
  const handleDeletePrompt = async (promptId: string) => {
    try {
      await deletePrompt(promptId);
      if (selectedPrompt && selectedPrompt.id === promptId) {
        setSelectedPrompt(null);
        handleCloseModal();
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };


  /**
   * @computed {PromptSFL[]} filteredPrompts
   * @description Get filtered prompts from the store.
   */
  const filteredPrompts = getFilteredPrompts();

  /**
   * @callback handleTestWithGemini
   * @description Handles testing a prompt with the Gemini API. It updates the prompt's state to show
   * loading, interpolates any variables into the prompt text, calls the API, and then updates the state
   * with the response or error.
   * @param {PromptSFL} promptToTest - The prompt to be tested.
   * @param {Record<string, string>} variables - A map of variable names to their values for interpolation.
   */
  const handleTestWithGemini = async (promptToTest: PromptSFL, variables: Record<string, string>) => {
    const updatePromptState = async (id: string, updates: Partial<PromptSFL>) => {
        const updatedPrompt = prompts.find(p => p.id === id);
        if (updatedPrompt) {
          await updatePrompt({ ...updatedPrompt, ...updates });
          setSelectedPrompt(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
        }
    };

    await updatePromptState(promptToTest.id, { isTesting: true, geminiResponse: undefined, geminiTestError: undefined });
    
    let finalPromptText = promptToTest.promptText;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
      finalPromptText = finalPromptText.replace(regex, variables[key] || '');
    });

    try {
      const responseText = await testPromptWithGemini(finalPromptText);
      await updatePromptState(promptToTest.id, { isTesting: false, geminiResponse: responseText, geminiTestError: undefined });
    } catch (error: any) {
      await updatePromptState(promptToTest.id, { isTesting: false, geminiTestError: error.message, geminiResponse: undefined });
    }
  };

  /**
   * @function sanitizeFilename
   * @description A utility function to sanitize a string for use as a filename.
   * @param {string} filename - The string to sanitize.
   * @returns {string} The sanitized filename.
   * @private
   */
  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
  };

  /**
   * @function handleExportSinglePrompt
   * @description Exports a single prompt as a JSON file.
   * @param {PromptSFL} promptToExport - The prompt to export.
   */
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

  /**
   * @function handleExportSinglePromptMarkdown
   * @description Exports a single prompt as a Markdown file.
   * @param {PromptSFL} promptToExport - The prompt to export.
   */
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

  /**
   * @function handleExportAllPrompts
   * @description Exports all prompts in the library as a single JSON file.
   */
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

  /**
   * @function handleExportAllPromptsMarkdown
   * @description Exports all prompts in the library as a single Markdown file.
   */
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

  /**
   * @function handleImportPrompts
   * @description Programmatically clicks the hidden file input to open the file import dialog.
   */
  const handleImportPrompts = () => {
      importFileRef.current?.click();
  };

  /**
   * @callback onFileImport
   * @description Handles the file import process once a user selects a file.
   * It reads, parses, and validates the JSON file, then merges the imported prompts
   * into the existing state, updating existing prompts and adding new ones.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const onFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
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
              
              // Import prompts using store actions
              let newPromptsCount = 0;
              let updatedPromptsCount = 0;
              const existingIds = new Set(prompts.map(p => p.id));

              for (const importedPrompt of importedPrompts) {
                  const cleanPrompt = {
                      ...importedPrompt,
                      geminiResponse: undefined,
                      geminiTestError: undefined,
                      isTesting: false,
                  };
                  
                  if (existingIds.has(importedPrompt.id)) {
                      updatedPromptsCount++;
                  } else {
                      newPromptsCount++;
                  }
                  
                  await updatePrompt(cleanPrompt);
              }
              
              alert(`Import successful!\n\nNew prompts: ${newPromptsCount}\nUpdated prompts: ${updatedPromptsCount}`);

          } catch (error: any) {
              console.error("Error importing prompts:", error);
              alert(`Import failed: ${error.message}`);
          } finally {
              if (event.target) {
                  event.target.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  /**
   * @function renderMainContent
   * @description A router-like function that renders the main content area based on the `activePage` state.
   * @returns {JSX.Element} The component for the currently active page.
   * @private
   */
  const renderMainContent = () => {
    switch(activePage) {
        case 'dashboard':
            return (
                <>
                    <Stats totalPrompts={prompts.length}/>
                    <div className="mt-8">
                        <PromptList 
                            onViewPrompt={handleOpenDetailModal}
                            onEditPrompt={handleOpenEditModal}
                            onDeletePrompt={handleDeletePrompt}
                            onExportJSON={handleExportSinglePrompt}
                            onExportMarkdown={handleExportSinglePromptMarkdown}
                        />
                    </div>
                </>
            );
        case 'lab':
            return <PromptLabPage />;
        case 'documentation':
            return <Documentation />;
        case 'settings':
            return <ProviderSetupPage onSetupComplete={checkSetupComplete} />;
        default:
             return (
                <div className="text-center py-20 bg-[#333e48] rounded-lg border border-[#5c6f7e]">
                    <h2 className="text-2xl font-bold text-gray-200">Coming Soon!</h2>
                    <p className="text-[#95aac0] mt-2">This page is under construction.</p>
                </div>
            );
    }
  }

  // Show loading screen while checking providers
  if (providersLoading) {
    return (
      <div className="flex h-screen bg-[#212934] font-sans">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-200">Initializing AI Providers...</h2>
          <p className="text-[#95aac0] mt-2">Checking available AI provider configurations</p>
        </div>
      </div>
    );
  }

  // Show error screen if provider validation failed
  if (providerError) {
    return (
      <div className="flex h-screen bg-[#212934] font-sans">
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-semibold text-red-200 mb-2">Provider Error</h2>
            <p className="text-red-300">{providerError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /**
   * Handle successful authentication by refreshing provider validation
   */
  const handleAuthSuccess = () => {
    refreshProviders();
  };

  return (
    <AuthGuard onAuthSuccess={handleAuthSuccess}>
      <div className="flex h-screen bg-[#212934] font-sans">
      <Sidebar 
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
          onAddConstant={addConstant}
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
        />
      )}

      {activeModal === ModalType.WIZARD && (
        <PromptWizardModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
          appConstants={appConstants}
          onAddConstant={addConstant}
        />
      )}

      {activeModal === ModalType.HELP && (
        <HelpModal
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
    </AuthGuard>
  );
};

export default App;