import { PromptSFL, Workflow } from '../types';

const API_BASE_URL = '/api/gemini';

export const testPromptWithGemini = async (promptText: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/test-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ promptText }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to test prompt');
  }
  const data = await response.json();
  return data.text;
};

export const generateSFLFromGoal = async (goal: string, sourceDocContent?: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
  const response = await fetch(`${API_BASE_URL}/generate-sfl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ goal, sourceDocContent }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate SFL from goal');
  }
  return response.json();
};

export const regenerateSFLFromSuggestion = async (
  currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>,
  suggestion: string
): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
  const response = await fetch(`${API_BASE_URL}/regenerate-sfl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPrompt, suggestion }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to regenerate SFL from suggestion');
  }
  return response.json();
};

export const generateWorkflowFromGoal = async (goal: string): Promise<Workflow> => {
  const response = await fetch(`${API_BASE_URL}/generate-workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ goal }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate workflow from goal');
  }
  return response.json();
};