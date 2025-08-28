import React, { useState } from 'react';
import { PromptSFL, ModalType } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Stats from './components/Stats';
import PromptList from './components/PromptList';
import Documentation from './components/Documentation';
import PromptLabPage from './components/lab/PromptLabPage';
import ProviderSetupPage from './components/settings/ProviderSetupPage';
import AuthGuard from './components/AuthGuard';

// Simple provider type
type SimpleProvider = 'google' | 'openai' | 'anthropic';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'dashboard' | 'lab' | 'documentation' | 'settings'>('dashboard');
  const [activeProvider, setActiveProvider] = useState<SimpleProvider>('google');
  const [prompts] = useState<PromptSFL[]>([]);

  const handleSaveApiKey = async (provider: SimpleProvider, apiKey: string) => {
    try {
      const response = await fetch(`/api/providers/${provider}/save-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
        credentials: 'include'
      });
      const result = await response.json();
      return { success: result.success, error: result.error };
    } catch (error) {
      return { success: false, error: 'Failed to save API key' };
    }
  };

  const renderMainContent = () => {
    switch(activePage) {
        case 'dashboard':
            return (
                <>
                    <Stats totalPrompts={prompts.length}/>
                    <div className="mt-8">
                        <PromptList 
                            onViewPrompt={() => {}}
                            onEditPrompt={() => {}}
                            onDeletePrompt={() => {}}
                            onExportJSON={() => {}}
                            onExportMarkdown={() => {}}
                        />
                    </div>
                </>
            );
        case 'lab':
            return <PromptLabPage />;
        case 'documentation':
            return <Documentation />;
        case 'settings':
            return <ProviderSetupPage 
                        onSaveApiKey={handleSaveApiKey}
                    />;
        default:
             return (
                <div className="text-center py-20 bg-[#333e48] rounded-lg border border-[#5c6f7e]">
                    <h2 className="text-2xl font-bold text-gray-200">Coming Soon!</h2>
                    <p className="text-[#95aac0] mt-2">This page is under construction.</p>
                </div>
            );
    }
  }
  
  // Stripped down App component for brevity, focusing on the provider logic
  return (
    <AuthGuard onAuthSuccess={initializeProviders}>
      <div className="flex h-screen bg-[#212934] font-sans">
        <Sidebar onNavigate={setPage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar onAddNewPrompt={() => {}} onOpenWizard={() => {}} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};

export default App;