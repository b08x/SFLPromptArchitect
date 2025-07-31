import { Request, Response, NextFunction } from 'express';
import WorkflowService from '../../services/workflowService';

class WorkflowController {
  async createWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await WorkflowService.createWorkflow(req.body);
      res.status(201).json(workflow);
    } catch (error) {
      next(error);
    }
  }

  async getWorkflows(req: Request, res: Response, next: NextFunction) {
    try {
      const workflows = await WorkflowService.getWorkflows();
      res.status(200).json(workflows);
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowById(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await WorkflowService.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      res.status(200).json(workflow);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await WorkflowService.updateWorkflow(req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      res.status(200).json(workflow);
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await WorkflowService.deleteWorkflow(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkflowController();
