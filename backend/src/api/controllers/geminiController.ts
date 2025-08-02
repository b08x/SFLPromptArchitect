import { Request, Response, NextFunction } from 'express';
import GeminiService from '../../services/geminiService';

class GeminiController {
  async testPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { promptText } = req.body;
      if (!promptText) {
        return res.status(400).json({ message: 'promptText is required' });
      }
      const result = await GeminiService.testPrompt(promptText);
      res.status(200).json({ text: result });
    } catch (error) {
      next(error);
    }
  }

  async generateSFLFromGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const { goal, sourceDocContent } = req.body;
      if (!goal) {
        return res.status(400).json({ message: 'Goal is required' });
      }
      const result = await GeminiService.generateSFLFromGoal(goal, sourceDocContent);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async regenerateSFLFromSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPrompt, suggestion } = req.body;
      if (!currentPrompt || !suggestion) {
        return res.status(400).json({ message: 'Current prompt and suggestion are required' });
      }
      const result = await GeminiService.regenerateSFLFromSuggestion(currentPrompt, suggestion);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async generateWorkflowFromGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const { goal } = req.body;
      if (!goal) {
        return res.status(400).json({ message: 'Goal is required' });
      }
      const result = await GeminiService.generateWorkflowFromGoal(goal);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new GeminiController();
