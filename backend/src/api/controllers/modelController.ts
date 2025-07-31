import { Request, Response, NextFunction } from 'express';
import ModelService from '../../services/modelService';

/**
 * @class ModelController
 * @description Controller for handling model-related requests.
 */
class ModelController {
  /**
   * @method getModels
   * @description Retrieves a list of all available models.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
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