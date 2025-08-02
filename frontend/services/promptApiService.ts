import { PromptSFL } from '../types';

const API_BASE_URL = '/api'; // Using a relative URL for proxying

/**
 * Fetches all SFL prompts from the backend API.
 * @returns {Promise<PromptSFL[]>} A promise that resolves to an array of prompts.
 * @throws {Error} If the network request fails.
 */
export const getPrompts = async (): Promise<PromptSFL[]> => {
  const response = await fetch(`${API_BASE_URL}/prompts`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
};

/**
 * Saves a new prompt or updates an existing one.
 * It determines whether to use POST (create) or PUT (update) based on the presence of an 'id' property in the prompt object.
 * @param {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'> | PromptSFL} prompt - The prompt object to save.
 * @returns {Promise<PromptSFL>} A promise that resolves to the saved prompt object as returned by the API.
 * @throws {Error} If the network request fails or the API returns an error.
 */
export const savePrompt = async (prompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'> | PromptSFL): Promise<PromptSFL> => {
  const isEditing = 'id' in prompt;
  const url = isEditing ? `${API_BASE_URL}/prompts/${prompt.id}` : `${API_BASE_URL}/prompts`;
  const method = isEditing ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prompt),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} prompt`);
  }
  return response.json();
};

/**
 * Deletes a prompt from the backend by its ID.
 * @param {string} id - The ID of the prompt to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is successful.
 * @throws {Error} If the network request fails.
 */
export const deletePrompt = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete prompt');
  }
};