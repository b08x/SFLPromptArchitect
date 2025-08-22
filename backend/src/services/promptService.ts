/**
 * @file promptService.ts
 * @description This service handles all business logic and database operations related to prompts.
 * It includes functions for creating, retrieving, updating, and deleting prompts,
 * as well as mapping between the SFL prompt format used in the frontend and the database schema.
 *
 * @requires ../config/database
 * @requires ../types
 * @since 0.5.1
 */

import pool from '../config/database';
import { Prompt, PromptSFL } from '../types';
import '../types/express';

/**
 * @class PromptService
 * @description A class to encapsulate all business logic for prompts.
 * Provides methods for CRUD operations on prompts and handles data transformation
 * between the SFL frontend format and the database schema.
 * 
 * @since 0.5.1
 */
class PromptService {
  /**
   * Maps the detailed `PromptSFL` format to the database `Prompt` format.
   * Transforms the rich SFL structure into a flattened database record where SFL metadata
   * is stored as JSON in the metadata column.
   * 
   * @param {PromptSFL | Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>} sflData - The SFL prompt data.
   * @param {string} userId - The ID of the authenticated user creating/updating the prompt.
   * @returns {Omit<Prompt, 'id' | 'created_at' | 'updated_at'>} The prompt data formatted for the database.
   * @private
   * @since 0.5.1
   */
  private mapSFLToPrompt(sflData: PromptSFL | Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<Prompt, 'id' | 'created_at' | 'updated_at'> {
    const metadata = {
      sflField: sflData.sflField,
      sflTenor: sflData.sflTenor,
      sflMode: sflData.sflMode,
      exampleOutput: sflData.exampleOutput,
      notes: sflData.notes,
      sourceDocument: sflData.sourceDocument,
    };

    return {
      user_id: userId,
      title: sflData.title || 'Untitled Prompt',
      body: sflData.promptText || '',
      metadata,
    };
  }

  /**
   * Maps a database `Prompt` record to the `PromptSFL` format.
   * Reconstructs the full SFL structure from the flattened database record,
   * providing default values for missing SFL components.
   * 
   * @param {Prompt} dbPrompt - The prompt record from the database.
   * @returns {PromptSFL} The prompt data in the SFL format.
   * @private
   * @since 0.5.1
   */
  private mapPromptToSFL(dbPrompt: Prompt): PromptSFL {
    const metadata = dbPrompt.metadata || {};
    
    return {
      id: dbPrompt.id,
      title: dbPrompt.title,
      promptText: dbPrompt.body,
      createdAt: dbPrompt.created_at,
      updatedAt: dbPrompt.updated_at,
      sflField: metadata.sflField || { topic: '', taskType: '', domainSpecifics: '', keywords: '' },
      sflTenor: metadata.sflTenor || { aiPersona: '', targetAudience: [], desiredTone: '', interpersonalStance: '' },
      sflMode: metadata.sflMode || { outputFormat: '', rhetoricalStructure: '', lengthConstraint: '', textualDirectives: '' },
      exampleOutput: metadata.exampleOutput,
      notes: metadata.notes,
      sourceDocument: metadata.sourceDocument,
    };
  }

  /**
   * Creates a new prompt in the database.
   * Validates required fields and transforms the SFL data before insertion.
   * 
   * @param {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>} promptData - The SFL data for the new prompt.
   * @param {string} userId - The ID of the authenticated user creating the prompt.
   * @returns {Promise<PromptSFL>} A promise that resolves to the newly created prompt.
   * @throws {Error} If the title or prompt text is empty.
   * 
   * @example
   * ```typescript
   * const newPromptData = {
   *   title: "My New Prompt",
   *   promptText: "Generate a summary of the following text: {{input}}",
   *   sflField: { topic: "Text Summarization", taskType: "Summarization", ... },
   *   // ... other SFL components
   * };
   * const createdPrompt = await promptService.createPrompt(newPromptData, userId);
   * ```
   * 
   * @since 0.5.1
   */
  async createPrompt(promptData: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<PromptSFL> {
    if (!promptData.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!promptData.promptText?.trim()) {
      throw new Error('Prompt text is required');
    }
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const mappedData = this.mapSFLToPrompt(promptData, userId);
    const result = await pool.query(
      'INSERT INTO prompts (user_id, title, body, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [mappedData.user_id, mappedData.title, mappedData.body, mappedData.metadata]
    );
    
    return this.mapPromptToSFL(result.rows[0]);
  }

  /**
   * Retrieves all prompts from the database.
   * Returns prompts ordered by most recently updated first.
   * 
   * @param {any} filters - An object containing filter criteria (currently unused, reserved for future filtering functionality).
   * @returns {Promise<PromptSFL[]>} A promise that resolves to an array of prompts in SFL format.
   * 
   * @example
   * ```typescript
   * const allPrompts = await promptService.getPrompts({});
   * console.log(`Found ${allPrompts.length} prompts`);
   * ```
   * 
   * @since 0.5.1
   */
  async getPrompts(filters: any): Promise<PromptSFL[]> {
    const result = await pool.query('SELECT * FROM prompts ORDER BY updated_at DESC');
    return result.rows.map(row => this.mapPromptToSFL(row));
  }

  /**
   * Retrieves a single prompt by its ID.
   * 
   * @param {string} id - The UUID of the prompt to retrieve.
   * @returns {Promise<PromptSFL | null>} A promise that resolves to the prompt in SFL format, or null if not found.
   * 
   * @example
   * ```typescript
   * const prompt = await promptService.getPromptById('123e4567-e89b-12d3-a456-426614174000');
   * if (prompt) {
   *   console.log(`Found prompt: ${prompt.title}`);
   * } else {
   *   console.log('Prompt not found');
   * }
   * ```
   * 
   * @since 0.5.1
   */
  async getPromptById(id: string): Promise<PromptSFL | null> {
    const result = await pool.query('SELECT * FROM prompts WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    return this.mapPromptToSFL(result.rows[0]);
  }

  /**
   * Updates an existing prompt in the database.
   * Performs partial updates by merging the provided data with the existing prompt.
   * Validates that title and promptText remain non-empty if they are being updated.
   * 
   * @param {string} id - The UUID of the prompt to update.
   * @param {Partial<PromptSFL>} promptData - An object containing the fields to update.
   * @param {string} userId - The ID of the authenticated user updating the prompt.
   * @returns {Promise<PromptSFL | null>} A promise that resolves to the updated prompt, or null if not found.
   * @throws {Error} If the title or prompt text is being updated to an empty value.
   * 
   * @example
   * ```typescript
   * const updates = {
   *   title: "Updated Prompt Title",
   *   sflField: { ...existingField, topic: "New Topic" }
   * };
   * const updatedPrompt = await promptService.updatePrompt(promptId, updates, userId);
   * ```
   * 
   * @since 0.5.1
   */
  async updatePrompt(id: string, promptData: Partial<PromptSFL>, userId: string): Promise<PromptSFL | null> {
    if (promptData.title !== undefined && !promptData.title?.trim()) {
      throw new Error('Title cannot be empty');
    }
    if (promptData.promptText !== undefined && !promptData.promptText?.trim()) {
      throw new Error('Prompt text cannot be empty');
    }
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const existing = await pool.query('SELECT * FROM prompts WHERE id = $1', [id]);
    if (!existing.rows[0]) return null;

    const existingSFL = this.mapPromptToSFL(existing.rows[0]);
    const updatedSFL = { ...existingSFL, ...promptData };
    const mappedData = this.mapSFLToPrompt(updatedSFL, userId);

    const result = await pool.query(
      'UPDATE prompts SET user_id = $1, title = $2, body = $3, metadata = $4, updated_at = now() WHERE id = $5 RETURNING *',
      [mappedData.user_id, mappedData.title, mappedData.body, mappedData.metadata, id]
    );
    
    return result.rows[0] ? this.mapPromptToSFL(result.rows[0]) : null;
  }

  /**
   * Deletes a prompt from the database.
   * 
   * @param {string} id - The UUID of the prompt to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false if the prompt was not found.
   * 
   * @example
   * ```typescript
   * const deleted = await promptService.deletePrompt('123e4567-e89b-12d3-a456-426614174000');
   * if (deleted) {
   *   console.log('Prompt successfully deleted');
   * } else {
   *   console.log('Prompt not found or could not be deleted');
   * }
   * ```
   * 
   * @since 0.5.1
   */
  async deletePrompt(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM prompts WHERE id = $1', [id]);
    return !!result.rowCount;
  }
}

/**
 * @exports {PromptService} promptService
 * @description Singleton instance of the PromptService class, ready to be used across the application.
 * This exported instance provides all prompt-related database operations and data transformations.
 * 
 * @since 0.5.1
 */
export default new PromptService();