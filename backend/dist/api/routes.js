"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promptController_1 = __importDefault(require("./controllers/promptController"));
const workflowController_1 = __importDefault(require("./controllers/workflowController"));
const modelController_1 = __importDefault(require("./controllers/modelController"));
const geminiController_1 = __importDefault(require("./controllers/geminiController"));
const workflowExecutionController_1 = __importDefault(require("./controllers/workflowExecutionController"));
/**
 * @file defines the routes for the application's API
 * @author Your Name
 * @see {@link http://expressjs.com/en/guide/routing.html|Express Routing}
 */
const router = (0, express_1.Router)();
// Prompt routes
router.post('/prompts', promptController_1.default.createPrompt);
router.get('/prompts', promptController_1.default.getPrompts);
router.get('/prompts/:id', promptController_1.default.getPromptById);
router.put('/prompts/:id', promptController_1.default.updatePrompt);
router.delete('/prompts/:id', promptController_1.default.deletePrompt);
// Workflow routes
router.post('/workflows', workflowController_1.default.createWorkflow);
router.get('/workflows', workflowController_1.default.getWorkflows);
router.get('/workflows/:id', workflowController_1.default.getWorkflowById);
router.put('/workflows/:id', workflowController_1.default.updateWorkflow);
router.delete('/workflows/:id', workflowController_1.default.deleteWorkflow);
router.post('/workflows/orchestrate', workflowController_1.default.orchestrateWorkflow);
router.post('/workflows/run-task', workflowExecutionController_1.default.runTask);
router.post('/workflows/execute', workflowExecutionController_1.default.executeWorkflow);
router.get('/workflows/jobs/:jobId/status', workflowExecutionController_1.default.getJobStatus);
// Model routes
router.get('/models', modelController_1.default.getModels);
// Gemini routes
router.post('/gemini/test-prompt', geminiController_1.default.testPrompt);
router.post('/gemini/generate-sfl', geminiController_1.default.generateSFLFromGoal);
router.post('/gemini/regenerate-sfl', geminiController_1.default.regenerateSFLFromSuggestion);
router.post('/gemini/generate-workflow', geminiController_1.default.generateWorkflowFromGoal);
exports.default = router;
