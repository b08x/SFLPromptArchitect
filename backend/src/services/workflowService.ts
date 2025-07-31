import pool from '../config/database';
import { Workflow } from '../types';

class WorkflowService {
  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    const { user_id, name, graph_data } = workflowData;
    const result = await pool.query(
      'INSERT INTO workflows (user_id, name, graph_data) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, graph_data]
    );
    return result.rows[0];
  }

  async getWorkflows(): Promise<Workflow[]> {
    const result = await pool.query('SELECT * FROM workflows ORDER BY updated_at DESC');
    return result.rows;
  }

  async getWorkflowById(id: string): Promise<Workflow | null> {
    const result = await pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateWorkflow(id: string, workflowData: Partial<Workflow>): Promise<Workflow | null> {
    const { name, graph_data } = workflowData;
    const result = await pool.query(
      'UPDATE workflows SET name = $1, graph_data = $2, updated_at = now() WHERE id = $3 RETURNING *',
      [name, graph_data, id]
    );
    return result.rows[0] || null;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM workflows WHERE id = $1', [id]);
    return !!result.rowCount;
  }
}

export default new WorkflowService();
