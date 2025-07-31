import { Router } from 'express';
import PromptController from './controllers/promptController';
import WorkflowController from './controllers/workflowController';
import ModelController from './controllers/modelController';

/**
 * @file defines the routes for the application's API
 * @author Your Name
 * @see {@link http://expressjs.com/en/guide/routing.html|Express Routing}
 */

const router = Router();

// Prompt routes
router.post('/prompts', PromptController.createPrompt);
router.get('/prompts', PromptController.getPrompts);
router.get('/prompts/:id', PromptController.getPromptById);
router.put('/prompts/:id', PromptController.updatePrompt);
router.delete('/prompts/:id', PromptController.deletePrompt);

// Workflow routes
router.post('/workflows', WorkflowController.createWorkflow);
router.get('/workflows', WorkflowController.getWorkflows);
router.get('/workflows/:id', WorkflowController.getWorkflowById);
router.put('/workflows/:id', WorkflowController.updateWorkflow);
router.delete('/workflows/:id', WorkflowController.deleteWorkflow);

// Model routes
router.get('/models', ModelController.getModels);

export default router;