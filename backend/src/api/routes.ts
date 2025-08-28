import { Router } from 'express';
import PromptController from './controllers/promptController';
import WorkflowController from './controllers/workflowController';
import ModelController from './controllers/modelController';
import WorkflowExecutionController from './controllers/workflowExecutionController';
import ProviderController from './controllers/providerController';
import authRoutes from './routes/auth';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware';

/**
 * @file defines the routes for the application's API
 * @author Your Name
 * @see {@link http://expressjs.com/en/guide/routing.html|Express Routing}
 */

const router = Router();

// Authentication routes (public)
router.use('/auth', authRoutes);

// Prompt routes (optional authentication for setup)
router.post('/prompts', optionalAuthMiddleware, PromptController.createPrompt);
router.get('/prompts', optionalAuthMiddleware, PromptController.getPrompts);
router.get('/prompts/:id', optionalAuthMiddleware, PromptController.getPromptById);
router.put('/prompts/:id', optionalAuthMiddleware, PromptController.updatePrompt);
router.delete('/prompts/:id', optionalAuthMiddleware, PromptController.deletePrompt);

// Workflow routes
router.post('/workflows', authMiddleware, WorkflowController.createWorkflow);
router.get('/workflows', authMiddleware, WorkflowController.getWorkflows);
router.get('/workflows/:id', authMiddleware, WorkflowController.getWorkflowById);
router.put('/workflows/:id', authMiddleware, WorkflowController.updateWorkflow);
router.delete('/workflows/:id', authMiddleware, WorkflowController.deleteWorkflow);
router.post('/workflows/orchestrate', authMiddleware, WorkflowController.orchestrateWorkflow);
router.post('/workflows/run-task', authMiddleware, WorkflowExecutionController.runTask);
router.post('/workflows/execute', authMiddleware, WorkflowExecutionController.executeWorkflow);
router.get('/workflows/jobs/:jobId/status', authMiddleware, WorkflowExecutionController.getJobStatus);
router.post('/workflows/stop/:jobId', authMiddleware, WorkflowExecutionController.stopWorkflow);

// Model routes (protected)
router.get('/models', authMiddleware, ModelController.getModels);


// Provider validation routes (optional authentication for setup)
router.get('/providers/status', optionalAuthMiddleware, ProviderController.getProviderStatus);
router.get('/providers/available', optionalAuthMiddleware, ProviderController.getAvailableProviders);
router.get('/providers/capabilities', optionalAuthMiddleware, ProviderController.getProviderCapabilities);
router.get('/providers/health', optionalAuthMiddleware, ProviderController.checkProviderHealth);
router.get('/providers/preferred', optionalAuthMiddleware, ProviderController.getPreferredProvider);
router.post('/providers/validate', optionalAuthMiddleware, ProviderController.validateProvider);

// Secure API key management routes (optional authentication for setup)
router.post('/providers/save-key', optionalAuthMiddleware, ProviderController.saveApiKey);
router.delete('/providers/clear-keys', optionalAuthMiddleware, ProviderController.clearApiKeys);
router.get('/providers/stored-keys', optionalAuthMiddleware, ProviderController.getStoredKeys);

// AI proxy routes (optional authentication)
router.post('/proxy/generate', optionalAuthMiddleware, ProviderController.proxyGenerate);

// SFL generation routes (optional authentication for setup)
router.post('/providers/generate-sfl', optionalAuthMiddleware, ProviderController.generateSFLFromGoal);
router.post('/providers/regenerate-sfl', optionalAuthMiddleware, ProviderController.regenerateSFLFromSuggestion);
router.post('/providers/generate-workflow', optionalAuthMiddleware, ProviderController.generateWorkflowFromGoal);

export default router;