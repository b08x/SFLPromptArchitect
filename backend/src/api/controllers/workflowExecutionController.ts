import { Request, Response, NextFunction } from 'express';
import WorkflowExecutionService from '../../services/workflowExecutionService';
import PromptService from '../../services/promptService';
import config from '../../config/env';
import { PromptSFL, Workflow } from '../../types';

// Conditionally import job service based on Redis availability
let JobService: any;
try {
  // Try to import the real job service
  JobService = require('../../services/jobService').default;
} catch (error) {
  console.warn('Redis not available, using mock job service');
  JobService = require('../../services/mockJobService').default;
}

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

  async executeWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { workflow, userInput } = req.body;
      
      if (!workflow) {
        return res.status(400).json({ message: 'Workflow is required' });
      }

      if (!workflow.id) {
        return res.status(400).json({ message: 'Workflow must have an ID' });
      }

      // Add workflow to execution queue
      const jobId = await JobService.addWorkflowJob(
        workflow.id,
        workflow as Workflow,
        userInput
      );

      // Return immediately with job ID and pending status
      res.status(202).json({
        jobId,
        status: 'pending',
        message: 'Workflow execution started. Use the job ID to check status.'
      });
    } catch (error) {
      next(error);
    }
  }

  async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({ message: 'Job ID is required' });
      }

      const jobStatus = await JobService.getJobStatus(jobId);
      
      if (!jobStatus) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.status(200).json(jobStatus);
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkflowExecutionController();
