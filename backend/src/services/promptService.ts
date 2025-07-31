import pool from '../config/database';
import { Prompt } from '../types';

class PromptService {
  async createPrompt(promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
    const { user_id, title, body, metadata } = promptData;
    const result = await pool.query(
      'INSERT INTO prompts (user_id, title, body, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, body, metadata]
    );
    return result.rows[0];
  }

  async getPrompts(filters: any): Promise<Prompt[]> {
    // Basic implementation without filters for now
    const result = await pool.query('SELECT * FROM prompts ORDER BY updated_at DESC');
    return result.rows;
  }

  async getPromptById(id: string): Promise<Prompt | null> {
    const result = await pool.query('SELECT * FROM prompts WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updatePrompt(id: string, promptData: Partial<Prompt>): Promise<Prompt | null> {
    const { title, body, metadata } = promptData;
    const result = await pool.query(
      'UPDATE prompts SET title = $1, body = $2, metadata = $3, updated_at = now() WHERE id = $4 RETURNING *',
      [title, body, metadata, id]
    );
    return result.rows[0] || null;
  }

  async deletePrompt(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM prompts WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

export default new PromptService();
