import { Request, Response, NextFunction } from 'express';
import PromptService from '../../services/promptService';
import '../../types/express';

/**
 * @class PromptController
 * @description Controller for handling prompt-related requests.
 */
class PromptController {
  /**
   * @method createPrompt
   * @description Creates a new prompt.
   * @param {Request} req - The Express request object, containing the prompt data in the body and user info.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async createPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const prompt = await PromptService.createPrompt(req.body, req.user.id);
      res.status(201).json(prompt);
    } catch (error) {
      console.error('Create prompt error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        next(error);
      }
    }
  }

  /**
   * @method getPrompts
   * @description Retrieves a list of prompts, with optional filtering.
   * @param {Request} req - The Express request object, containing query parameters for filtering.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async getPrompts(req: Request, res: Response, next: NextFunction) {
    try {
      const prompts = await PromptService.getPrompts(req.query);
      res.status(200).json(prompts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getPromptById
   * @description Retrieves a single prompt by its ID.
   * @param {Request} req - The Express request object, containing the prompt ID as a URL parameter.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async getPromptById(req: Request, res: Response, next: NextFunction) {
    try {
      const prompt = await PromptService.getPromptById(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
      res.status(200).json(prompt);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method updatePrompt
   * @description Updates an existing prompt.
   * @param {Request} req - The Express request object, containing the prompt ID as a URL parameter, update data in the body, and user info.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async updatePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const prompt = await PromptService.updatePrompt(req.params.id, req.body, req.user.id);
      if (!prompt) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
      res.status(200).json(prompt);
    } catch (error) {
      console.error('Update prompt error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        next(error);
      }
    }
  }

  /**
   * @method deletePrompt
   * @description Deletes a prompt by its ID.
   * @param {Request} req - The Express request object, containing the prompt ID as a URL parameter.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async deletePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await PromptService.deletePrompt(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PromptController();