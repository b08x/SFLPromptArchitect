/**
 * @file appStore.ts
 * @description Centralized state management store using Zustand. This store eliminates prop drilling 
 * by providing a single source of truth for the application's state including prompts, filters, 
 * active page, and loading states. It includes actions for managing prompts and filters.
 *
 * @requires zustand
 * @requires ../types
 * @requires ../services/promptApiService
 * @requires ../constants
 */

import { create } from 'zustand';
import { PromptSFL, Filters } from '../types';
import { getPrompts, savePrompt, deletePrompt as apiDeletePrompt } from '../services/promptApiService';
import { TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS, POPULAR_TAGS } from '../constants';

/**
 * @typedef {'dashboard' | 'lab' | 'documentation' | 'settings'} Page
 * @description Represents the possible main pages the user can navigate to.
 */
type Page = 'dashboard' | 'lab' | 'documentation' | 'settings';

/**
 * @constant {Filters} initialFilters - The default state for the prompt filters.
 */
const initialFilters: Filters = {
  searchTerm: '',
  topic: '',
  taskType: '',
  aiPersona: '',
  outputFormat: '',
};

/**
 * @interface AppState
 * @description Defines the complete state structure for the application store.
 */
interface AppState {
  // State
  prompts: PromptSFL[];
  filters: Filters;
  activePage: Page;
  isLoading: boolean;
  error: string | null;
  appConstants: {
    taskTypes: string[];
    aiPersonas: string[];
    targetAudiences: string[];
    desiredTones: string[];
    outputFormats: string[];
    lengthConstraints: string[];
    popularTags: string[];
  };

  // Actions
  fetchPrompts: () => Promise<void>;
  addPrompt: (prompt: PromptSFL) => Promise<void>;
  updatePrompt: (prompt: PromptSFL) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  setPage: (page: Page) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addConstant: (key: keyof AppState['appConstants'], value: string) => void;
  
  // Computed getters
  getFilteredPrompts: () => PromptSFL[];
}

/**
 * @hook useAppStore
 * @description The main Zustand store hook that provides access to the application state and actions.
 * This replaces the need for prop drilling by allowing components to directly access and modify 
 * the global state.
 */
export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  prompts: [],
  filters: initialFilters,
  activePage: 'dashboard',
  isLoading: false,
  error: null,
  appConstants: {
    taskTypes: TASK_TYPES,
    aiPersonas: AI_PERSONAS,
    targetAudiences: TARGET_AUDIENCES,
    desiredTones: DESIRED_TONES,
    outputFormats: OUTPUT_FORMATS,
    lengthConstraints: LENGTH_CONSTRAINTS,
    popularTags: POPULAR_TAGS,
  },

  // Actions
  fetchPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const fetchedPrompts = await getPrompts();
      set({ prompts: fetchedPrompts, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch prompts', 
        isLoading: false 
      });
    }
  },

  addPrompt: async (prompt: PromptSFL) => {
    try {
      const saved = await savePrompt(prompt);
      set(state => ({
        prompts: [saved, ...state.prompts].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      }));
    } catch (error) {
      console.error("Failed to add prompt:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to add prompt' });
      throw error;
    }
  },

  updatePrompt: async (prompt: PromptSFL) => {
    try {
      const saved = await savePrompt(prompt);
      set(state => {
        const existingIndex = state.prompts.findIndex(p => p.id === saved.id);
        if (existingIndex > -1) {
          // Update existing prompt
          const updatedPrompts = [...state.prompts];
          updatedPrompts[existingIndex] = saved;
          return {
            prompts: updatedPrompts.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
          };
        } else {
          // Add new prompt
          return {
            prompts: [saved, ...state.prompts].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
          };
        }
      });
    } catch (error) {
      console.error("Failed to update prompt:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to update prompt' });
      throw error;
    }
  },

  deletePrompt: async (promptId: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }
    
    try {
      await apiDeletePrompt(promptId);
      set(state => ({
        prompts: state.prompts.filter(p => p.id !== promptId)
      }));
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete prompt' });
      alert("Failed to delete prompt. Please try again.");
    }
  },

  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value }
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  setPage: (page: Page) => {
    set({ activePage: page });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  addConstant: (key, value) => {
    if (!value || !value.trim()) return;
    const trimmedValue = value.trim();
    
    set(state => {
      const currentValues = state.appConstants[key];
      if (!Array.isArray(currentValues)) return state;

      const lowerCaseValue = trimmedValue.toLowerCase();
      const existingValues = currentValues.map(v => String(v).toLowerCase());

      if (existingValues.includes(lowerCaseValue)) {
        return state;
      }

      return {
        ...state,
        appConstants: {
          ...state.appConstants,
          [key]: [...currentValues, trimmedValue]
        }
      };
    });
  },

  // Computed getters
  getFilteredPrompts: () => {
    const { prompts, filters } = get();
    
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

      const matchesSearchTerm = filters.searchTerm === '' || 
        searchFields.some(field => field && field.toLowerCase().includes(searchTermLower));
      const matchesTaskType = filters.taskType === '' || p.sflField.taskType === filters.taskType;
      const matchesAiPersona = filters.aiPersona === '' || p.sflTenor.aiPersona === filters.aiPersona;
      
      return matchesSearchTerm && matchesTaskType && matchesAiPersona;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },
}));