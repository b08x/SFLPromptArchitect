/**
 * @file workflowService.ts
 * @description This service handles all business logic and database operations related to workflows.
 * It provides methods for creating, retrieving, updating, and deleting workflows.
 *
 * @requires ../config/database
 * @requires ../types
 */

import pool from '../config/database';
import { Workflow } from '../types';

/**
 * @class WorkflowService
 * @description A class to encapsulate all business logic for workflows.
 */
class WorkflowService {
  /**
   * Creates a new workflow in the database.
   * @param {Omit<Workflow, 'id' | 'created_at' | 'updated_at'>} workflowData - The data for the new workflow.
   * @returns {Promise<Workflow>} A promise that resolves to the newly created workflow.
   */
  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    const { user_id, name, graph_data } = workflowData;
    const result = await pool.query(
      'INSERT INTO workflows (user_id, name, graph_data) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, graph_data]
    );
    return result.rows[0];
  }

  /**
   * Retrieves all workflows from the database.
   * @returns {Promise<Workflow[]>} A promise that resolves to an array of workflows.
   */
  async getWorkflows(): Promise<Workflow[]> {
    const result = await pool.query('SELECT * FROM workflows ORDER BY updated_at DESC');
    return result.rows;
  }

  /**
   * Retrieves a single workflow by its ID.
   * @param {string} id - The ID of the workflow to retrieve.
   * @returns {Promise<Workflow | null>} A promise that resolves to the workflow, or null if not found.
   */
  async getWorkflowById(id: string): Promise<Workflow | null> {
    const result = await pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Updates an existing workflow in the database.
   * @param {string} id - The ID of the workflow to update.
   * @param {Partial<Workflow>} workflowData - An object containing the fields to update.
   * @returns {Promise<Workflow | null>} A promise that resolves to the updated workflow, or null if not found.
   */
  async updateWorkflow(id: string, workflowData: Partial<Workflow>): Promise<Workflow | null> {
    // First, fetch the existing workflow from the database
    const existing = await pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    if (!existing.rows[0]) return null;

    // Create a merged object by combining existing data with new data
    const name = workflowData.name ?? existing.rows[0].name;
    const graph_data = workflowData.graph_data ?? existing.rows[0].graph_data;

    // Update with the merged values to ensure partial updates don't overwrite existing data
    const result = await pool.query(
      'UPDATE workflows SET name = $1, graph_data = $2, updated_at = now() WHERE id = $3 RETURNING *',
      [name, graph_data, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Deletes a workflow from the database.
   * @param {string} id - The ID of the workflow to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false otherwise.
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM workflows WHERE id = $1', [id]);
    return !!result.rowCount;
  }
}

export default new WorkflowService();