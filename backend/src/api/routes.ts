import { Router } from 'express';
import PromptController from './controllers/promptController';
import WorkflowController from './controllers/workflowController';
import ModelController from './controllers/modelController';
import GeminiController from './controllers/geminiController';
import WorkflowExecutionController from './controllers/workflowExecutionController';
import ProviderController from './controllers/providerController';

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
router.post('/workflows/orchestrate', WorkflowController.orchestrateWorkflow);
router.post('/workflows/run-task', WorkflowExecutionController.runTask);
router.post('/workflows/execute', WorkflowExecutionController.executeWorkflow);
router.get('/workflows/jobs/:jobId/status', WorkflowExecutionController.getJobStatus);
router.post('/workflows/stop/:jobId', WorkflowExecutionController.stopWorkflow);

// Model routes
router.get('/models', ModelController.getModels);

// Gemini routes
router.post('/gemini/test-prompt', GeminiController.testPrompt);
router.post('/gemini/generate-sfl', GeminiController.generateSFLFromGoal);
router.post('/gemini/regenerate-sfl', GeminiController.regenerateSFLFromSuggestion);
router.post('/gemini/generate-workflow', GeminiController.generateWorkflowFromGoal);

// Provider validation routes
router.get('/providers/status', ProviderController.getProviderStatus);
router.get('/providers/available', ProviderController.getAvailableProviders);
router.get('/providers/health', ProviderController.checkProviderHealth);
router.get('/providers/preferred', ProviderController.getPreferredProvider);
router.post('/providers/validate', ProviderController.validateProvider);

export default router;