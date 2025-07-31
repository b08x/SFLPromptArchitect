import { PromptSFL } from '../types';

const API_BASE_URL = '/api'; // Using a relative URL for proxying

export const getPrompts = async (): Promise<PromptSFL[]> => {
  const response = await fetch(`${API_BASE_URL}/prompts`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
};

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

export const deletePrompt = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete prompt');
  }
};
