
import { PromptSFL, Workflow } from '../types';

const API_BASE_URL = '/api/gemini';

/**
 * Sends a prompt to the Gemini API for testing.
 * @param promptText - The text of the prompt to test.
 * @returns A promise that resolves to the Gemini API's response text.
 * @throws An error if the API request fails.
 */
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

/**
 * Generates a Structured Prompt Formulation Language (SFL) prompt from a user's goal.
 * @param goal - The user's goal to be converted into an SFL prompt.
 * @param sourceDocContent - Optional content from a source document to inform the generation.
 * @returns A promise that resolves to the generated SFL prompt, omitting metadata fields.
 * @throws An error if the API request fails.
 */
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

/**
 * Regenerates an SFL prompt based on a user's suggestion for improvement.
 * @param currentPrompt - The current SFL prompt to be improved.
 * @param suggestion - The user's suggestion for regeneration.
 * @returns A promise that resolves to the regenerated SFL prompt, omitting metadata fields.
 * @throws An error if the API request fails.
 */
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

/**
 * Generates a workflow from a user's goal.
 * @param goal - The user's goal to be converted into a workflow.
 * @returns A promise that resolves to the generated workflow.
 * @throws An error if the API request fails.
 */
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
