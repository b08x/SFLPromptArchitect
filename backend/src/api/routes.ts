import { Router } from 'express';
import PromptController from './controllers/promptController';
import WorkflowController from './controllers/workflowController';

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

export default router;
