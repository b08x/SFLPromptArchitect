/**
 * @file modelService.ts
 * @description This service handles database operations related to AI models.
 * It provides methods to retrieve information about the available models.
 *
 * @requires ../config/database
 */

import pool from '../config/database';

/**
 * @interface Model
 * @description Represents the structure of a model record in the database.
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
 */
class ModelService {
  /**
   * Retrieves all active models from the database.
   * @returns {Promise<Model[]>} A promise that resolves to an array of active models.
   */
  async getModels(): Promise<Model[]> {
    const result = await pool.query('SELECT * FROM models WHERE is_active = true ORDER BY name');
    return result.rows;
  }
}

export default new ModelService();