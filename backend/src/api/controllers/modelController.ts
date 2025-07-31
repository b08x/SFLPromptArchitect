import { Request, Response, NextFunction } from 'express';
import ModelService from '../../services/modelService';

class ModelController {
  async getModels(req: Request, res: Response, next: NextFunction) {
    try {
      const models = await ModelService.getModels();
      res.status(200).json(models);
    } catch (error) {
      next(error);
    }
  }
}

export default new ModelController();
