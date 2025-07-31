import { Request, Response, NextFunction } from 'express';
import PromptService from '../services/promptService';

class PromptController {
  async createPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const prompt = await PromptService.createPrompt(req.body);
      res.status(201).json(prompt);
    } catch (error) {
      next(error);
    }
  }

  async getPrompts(req: Request, res: Response, next: NextFunction) {
    try {
      const prompts = await PromptService.getPrompts(req.query);
      res.status(200).json(prompts);
    } catch (error) {
      next(error);
    }
  }

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

  async updatePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const prompt = await PromptService.updatePrompt(req.params.id, req.body);
      if (!prompt) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
      res.status(200).json(prompt);
    } catch (error) {
      next(error);
    }
  }

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
