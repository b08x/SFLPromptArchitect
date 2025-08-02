import { Request, Response, NextFunction } from 'express';
import WorkflowService from '../../services/workflowService';

/**
 * @class WorkflowController
 * @description Controller for handling workflow-related requests.
 */
class WorkflowController {
  /**
   * @method createWorkflow
   * @description Creates a new workflow.
   * @param {Request} req - The Express request object, containing the workflow data in the body.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async createWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await WorkflowService.createWorkflow(req.body);
      res.status(201).json(workflow);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getWorkflows
   * @description Retrieves a list of all workflows.
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
  async getWorkflows(req: Request, res: Response, next: NextFunction) {
    try {
      const workflows = await WorkflowService.getWorkflows();
      res.status(200).json(workflows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getWorkflowById
   * @description Retrieves a single workflow by its ID.
   * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
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

  /**
   * @method updateWorkflow
   * @description Updates an existing workflow.
   * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter and the update data in the body.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
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

  /**
   * @method deleteWorkflow
   * @description Deletes a workflow by its ID.
   * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the response is sent.
   */
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