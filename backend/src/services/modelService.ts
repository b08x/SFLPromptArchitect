/**
 * @file modelService.ts
 * @description This service handles database operations related to AI models.
 * It provides methods to retrieve information about the available models that can be used
 * for workflow tasks and prompt testing. Models are stored in the database with metadata
 * about their capabilities and availability.
 *
 * @requires ../config/database
 * @since 0.5.1
 */

import getPool from '../config/database';

/**
 * @interface Model
 * @description Represents the structure of a model record in the database.
 * Contains metadata about an AI model including its name, description, and active status.
 * 
 * @property {string} id - The unique identifier for the model.
 * @property {string} name - The display name of the model (e.g., 'gemini-1.5-flash').
 * @property {string|null} description - Optional description of the model's capabilities.
 * @property {boolean} is_active - Whether the model is currently available for use.
 * 
 * @since 0.5.1
 */
interface Model {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

/**
 * @class ModelService
 * @description A class to encapsulate all database logic for AI models.
 * Provides methods to retrieve model information for use in workflow configuration
 * and prompt testing interfaces.
 * 
 * @since 0.5.1
 */
class ModelService {
  /**
   * Retrieves all active models from the database.
   * Returns only models that are currently available for use, ordered alphabetically by name.
   * 
   * @returns {Promise<Model[]>} A promise that resolves to an array of active models.
   * 
   * @example
   * ```typescript
   * const availableModels = await modelService.getModels();
   * console.log('Available models:');
   * availableModels.forEach(model => {
   *   console.log(`- ${model.name}: ${model.description || 'No description'}`);
   * });
   * ```
   * 
   * @since 0.5.1
   */
  async getModels(): Promise<Model[]> {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM models WHERE is_active = true ORDER BY name');
    return result.rows;
  }
}

/**
 * @exports {ModelService} modelService
 * @description Singleton instance of the ModelService class, ready to be used across the application.
 * This exported instance provides all model-related database operations.
 * 
 * @since 0.5.1
 */
export default new ModelService();