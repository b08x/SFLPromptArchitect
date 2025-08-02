import { Request, Response, NextFunction } from 'express';
import WorkflowExecutionService from '../../services/workflowExecutionService';
import PromptService from '../../services/promptService';
import { PromptSFL } from '../../types';

class WorkflowExecutionController {
  async runTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { task, dataStore } = req.body;
      if (!task || !dataStore) {
        return res.status(400).json({ message: 'Task and dataStore are required' });
      }
      
      // Optimize: Only fetch the specific prompt if needed, instead of all prompts
      let linkedPrompt: PromptSFL | undefined;
      if (task.promptId) {
        const foundPrompt = await PromptService.getPromptById(task.promptId);
        if (!foundPrompt) {
          return res.status(404).json({ message: `Prompt with ID ${task.promptId} not found` });
        }
        linkedPrompt = foundPrompt;
      }
      
      const result = await WorkflowExecutionService.executeTask(task, dataStore, linkedPrompt);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkflowExecutionController();
