import { Router } from 'express';
import PromptController from './controllers/promptController';
import WorkflowController from './controllers/workflowController';
import ModelController from './controllers/modelController';
import GeminiController from './controllers/geminiController';
import WorkflowExecutionController from './controllers/workflowExecutionController';
import ProviderController from './controllers/providerController';
import authRoutes from './routes/auth';
import authMiddleware from '../middleware/authMiddleware';

/**
 * @file defines the routes for the application's API
 * @author Your Name
 * @see {@link http://expressjs.com/en/guide/routing.html|Express Routing}
 */

const router = Router();

// Authentication routes (public)
router.use('/auth', authRoutes);

// Protected routes requiring authentication
// Prompt routes
router.post('/prompts', authMiddleware, PromptController.createPrompt);
router.get('/prompts', authMiddleware, PromptController.getPrompts);
router.get('/prompts/:id', authMiddleware, PromptController.getPromptById);
router.put('/prompts/:id', authMiddleware, PromptController.updatePrompt);
router.delete('/prompts/:id', authMiddleware, PromptController.deletePrompt);

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

// Gemini routes (protected)
router.post('/gemini/test-prompt', authMiddleware, GeminiController.testPrompt);
router.post('/gemini/generate-sfl', authMiddleware, GeminiController.generateSFLFromGoal);
router.post('/gemini/regenerate-sfl', authMiddleware, GeminiController.regenerateSFLFromSuggestion);
router.post('/gemini/generate-workflow', authMiddleware, GeminiController.generateWorkflowFromGoal);

// Provider validation routes (protected - contains sensitive API key operations)
router.get('/providers/status', authMiddleware, ProviderController.getProviderStatus);
router.get('/providers/available', authMiddleware, ProviderController.getAvailableProviders);
router.get('/providers/health', authMiddleware, ProviderController.checkProviderHealth);
router.get('/providers/preferred', authMiddleware, ProviderController.getPreferredProvider);
router.post('/providers/validate', authMiddleware, ProviderController.validateProvider);

// Secure API key management routes (highly sensitive - requires authentication)
router.post('/providers/save-key', authMiddleware, ProviderController.saveApiKey);
router.delete('/providers/clear-keys', authMiddleware, ProviderController.clearApiKeys);
router.get('/providers/stored-keys', authMiddleware, ProviderController.getStoredKeys);

// AI proxy routes (protected)
router.post('/proxy/generate', authMiddleware, ProviderController.proxyGenerate);

export default router;