/**
 * @file geminiService.ts
 * @description This service module provides functions for interacting with the backend's Gemini API endpoints.
 * It handles tasks such as testing prompts, generating SFL structures from goals, and regenerating prompts based on feedback.
 *
 * @requires ../types
 */

import { PromptSFL, Workflow } from '../types';

/**
 * @constant {string} API_BASE_URL - The base URL for the Gemini API endpoints.
 * @private
 */
const API_BASE_URL = '/api/gemini';

/**
 * Sends a prompt to the Gemini API for testing.
 * This function communicates with the backend, which in turn calls the actual Gemini API.
 *
 * @param {string} promptText - The raw text of the prompt to be tested.
 * @returns {Promise<string>} A promise that resolves to the text response from the Gemini model.
 * @throws {Error} Throws an error if the API response is not ok, containing a message from the server.
 *
 * @example
 * try {
 *   const response = await testPromptWithGemini("Explain quantum computing in simple terms.");
 *   console.log(response);
 * } catch (error) {
 *   console.error("Test failed:", error.message);
 * }
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
 * Generates a complete SFL (Systemic Functional Linguistics) prompt structure from a high-level user goal.
 * This is used for the "Prompt Wizard" feature.
 *
 * @param {string} goal - A natural language string describing what the user wants the prompt to achieve.
 * @param {string} [sourceDocContent] - Optional content from a source document to provide stylistic or contextual reference.
 * @returns {Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>} A promise that resolves to the generated SFL prompt object,
 * ready to be saved or further edited.
 * @throws {Error} Throws an error if the API response is not ok.
 *
 * @example
 * const goal = "Create a Python function to sort a list of numbers.";
 * const newPrompt = await generateSFLFromGoal(goal);
 * // newPrompt can now be used to populate the prompt editor form.
 */
export const generateSFLFromGoal = async (goal: string, sourceDocContent?: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
  console.log(`Making request to: ${API_BASE_URL}/generate-sfl`);
  console.log('Request payload:', { goal, sourceDocContent: sourceDocContent ? '[provided]' : undefined });
  
  const response = await fetch(`${API_BASE_URL}/generate-sfl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ goal, sourceDocContent }),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);

  if (!response.ok) {
    const responseText = await response.text();
    console.error('Error response text:', responseText.substring(0, 500));
    
    // Try to parse as JSON, but fallback to text message
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.message || 'Failed to generate SFL from goal');
    } catch (parseError) {
      // Response is not JSON, likely HTML error page
      if (responseText.includes('<html>')) {
        throw new Error('Server returned HTML instead of JSON. Check if backend server is running and proxy is configured correctly.');
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }
  
  const responseText = await response.text();
  console.log('Success response text:', responseText.substring(0, 200));
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse success response as JSON:', parseError);
    throw new Error('Server returned invalid JSON response');
  }
};

/**
 * Takes an existing SFL prompt and a user's suggestion to regenerate and improve it.
 * The backend uses an AI model to interpret the suggestion and modify the SFL fields accordingly.
 *
 * @param {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>} currentPrompt - The current state of the prompt to be improved.
 * @param {string} suggestion - A natural language string with instructions for improvement (e.g., "make it more formal").
 * @returns {Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>>} A promise that resolves to the newly regenerated SFL prompt object.
 * @throws {Error} Throws an error if the API response is not ok.
 *
 * @example
 * const suggestion = "Change the target audience to experts in the field.";
 * const refinedPrompt = await regenerateSFLFromSuggestion(existingPrompt, suggestion);
 * // refinedPrompt contains the AI-modified SFL structure.
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
 * Generates a structured workflow object from a high-level user goal.
 * This is used for the "Workflow Wizard" feature.
 *
 * @param {string} goal - A natural language string describing the multi-step process the user wants to automate.
 * @returns {Promise<Workflow>} A promise that resolves to the generated `Workflow` object, including its tasks.
 * @throws {Error} Throws an error if the API response is not ok.
 *
 * @example
 * const goal = "Summarize an article and then translate the summary to French.";
 * const newWorkflow = await generateWorkflowFromGoal(goal);
 * // newWorkflow can now be saved or opened in the workflow editor.
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