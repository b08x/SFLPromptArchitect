import pool from '../config/database';

interface Model {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

class ModelService {
  async getModels(): Promise<Model[]> {
    const result = await pool.query('SELECT * FROM models WHERE is_active = true ORDER BY name');
    return result.rows;
  }
}

export default new ModelService();
