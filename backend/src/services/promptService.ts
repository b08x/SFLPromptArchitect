import pool from '../config/database';
import { Prompt, PromptSFL } from '../types';

class PromptService {
  // Convert PromptSFL to database Prompt format
  private mapSFLToPrompt(sflData: PromptSFL | Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>): Omit<Prompt, 'id' | 'created_at' | 'updated_at'> {
    const metadata = {
      sflField: sflData.sflField,
      sflTenor: sflData.sflTenor,
      sflMode: sflData.sflMode,
      exampleOutput: sflData.exampleOutput,
      notes: sflData.notes,
      sourceDocument: sflData.sourceDocument,
    };

    return {
      user_id: '79e06398-14dc-4d4c-b2b2-7611e742172c', // TODO: Replace with actual user ID from authentication
      title: sflData.title || 'Untitled Prompt',
      body: sflData.promptText || '',
      metadata,
    };
  }

  // Convert database Prompt back to PromptSFL format
  private mapPromptToSFL(dbPrompt: Prompt): PromptSFL {
    const metadata = dbPrompt.metadata || {};
    
    return {
      id: dbPrompt.id,
      title: dbPrompt.title,
      promptText: dbPrompt.body,
      createdAt: dbPrompt.created_at,
      updatedAt: dbPrompt.updated_at,
      sflField: metadata.sflField || {
        topic: '',
        taskType: '',
        domainSpecifics: '',
        keywords: '',
      },
      sflTenor: metadata.sflTenor || {
        aiPersona: '',
        targetAudience: [],
        desiredTone: '',
        interpersonalStance: '',
      },
      sflMode: metadata.sflMode || {
        outputFormat: '',
        rhetoricalStructure: '',
        lengthConstraint: '',
        textualDirectives: '',
      },
      exampleOutput: metadata.exampleOutput,
      notes: metadata.notes,
      sourceDocument: metadata.sourceDocument,
    };
  }

  async createPrompt(promptData: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptSFL> {
    if (!promptData.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!promptData.promptText?.trim()) {
      throw new Error('Prompt text is required');
    }

    const mappedData = this.mapSFLToPrompt(promptData);
    const result = await pool.query(
      'INSERT INTO prompts (user_id, title, body, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [mappedData.user_id, mappedData.title, mappedData.body, mappedData.metadata]
    );
    
    return this.mapPromptToSFL(result.rows[0]);
  }

  async getPrompts(filters: any): Promise<PromptSFL[]> {
    // Basic implementation without filters for now
    const result = await pool.query('SELECT * FROM prompts ORDER BY updated_at DESC');
    return result.rows.map(row => this.mapPromptToSFL(row));
  }

  async getPromptById(id: string): Promise<PromptSFL | null> {
    const result = await pool.query('SELECT * FROM prompts WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    return this.mapPromptToSFL(result.rows[0]);
  }

  async updatePrompt(id: string, promptData: Partial<PromptSFL>): Promise<PromptSFL | null> {
    // Validate required fields if they're being updated
    if (promptData.title !== undefined && !promptData.title?.trim()) {
      throw new Error('Title cannot be empty');
    }
    if (promptData.promptText !== undefined && !promptData.promptText?.trim()) {
      throw new Error('Prompt text cannot be empty');
    }

    // Get the existing prompt to merge with updates
    const existing = await pool.query('SELECT * FROM prompts WHERE id = $1', [id]);
    if (!existing.rows[0]) return null;

    const existingSFL = this.mapPromptToSFL(existing.rows[0]);
    const updatedSFL = { ...existingSFL, ...promptData };
    const mappedData = this.mapSFLToPrompt(updatedSFL);

    const result = await pool.query(
      'UPDATE prompts SET title = $1, body = $2, metadata = $3, updated_at = now() WHERE id = $4 RETURNING *',
      [mappedData.title, mappedData.body, mappedData.metadata, id]
    );
    
    return result.rows[0] ? this.mapPromptToSFL(result.rows[0]) : null;
  }

  async deletePrompt(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM prompts WHERE id = $1', [id]);
    return !!result.rowCount;
  }
}

export default new PromptService();
