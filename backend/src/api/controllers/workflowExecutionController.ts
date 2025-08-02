import { Request, Response, NextFunction } from 'express';
import WorkflowExecutionService from '../../services/workflowExecutionService';
import PromptService from '../../services/promptService';

class WorkflowExecutionController {
  async runTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { task, dataStore } = req.body;
      if (!task || !dataStore) {
        return res.status(400).json({ message: 'Task and dataStore are required' });
      }
      // We need to fetch all prompts to be able to find the linked prompt
      const prompts = await PromptService.getPrompts({});
      const result = await WorkflowExecutionService.executeTask(task, dataStore, prompts);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkflowExecutionController();
