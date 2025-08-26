"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const providerController_1 = __importDefault(require("./controllers/providerController"));
const auth_1 = __importDefault(require("./routes/auth"));
const authMiddleware_1 = __importStar(require("../middleware/authMiddleware"));
/**
 * @file defines the routes for the application's API
 * @author Your Name
 * @see {@link http://expressjs.com/en/guide/routing.html|Express Routing}
 */
const router = (0, express_1.Router)();
// Authentication routes (public)
router.use('/auth', auth_1.default);
// Prompt routes (optional authentication for setup)
router.post('/prompts', authMiddleware_1.optionalAuthMiddleware, promptController_1.default.createPrompt);
router.get('/prompts', authMiddleware_1.optionalAuthMiddleware, promptController_1.default.getPrompts);
router.get('/prompts/:id', authMiddleware_1.optionalAuthMiddleware, promptController_1.default.getPromptById);
router.put('/prompts/:id', authMiddleware_1.optionalAuthMiddleware, promptController_1.default.updatePrompt);
router.delete('/prompts/:id', authMiddleware_1.optionalAuthMiddleware, promptController_1.default.deletePrompt);
// Workflow routes
router.post('/workflows', authMiddleware_1.default, workflowController_1.default.createWorkflow);
router.get('/workflows', authMiddleware_1.default, workflowController_1.default.getWorkflows);
router.get('/workflows/:id', authMiddleware_1.default, workflowController_1.default.getWorkflowById);
router.put('/workflows/:id', authMiddleware_1.default, workflowController_1.default.updateWorkflow);
router.delete('/workflows/:id', authMiddleware_1.default, workflowController_1.default.deleteWorkflow);
router.post('/workflows/orchestrate', authMiddleware_1.default, workflowController_1.default.orchestrateWorkflow);
router.post('/workflows/run-task', authMiddleware_1.default, workflowExecutionController_1.default.runTask);
router.post('/workflows/execute', authMiddleware_1.default, workflowExecutionController_1.default.executeWorkflow);
router.get('/workflows/jobs/:jobId/status', authMiddleware_1.default, workflowExecutionController_1.default.getJobStatus);
router.post('/workflows/stop/:jobId', authMiddleware_1.default, workflowExecutionController_1.default.stopWorkflow);
// Model routes (protected)
router.get('/models', authMiddleware_1.default, modelController_1.default.getModels);
// Gemini routes (optional authentication for initial setup)
router.post('/gemini/test-prompt', authMiddleware_1.optionalAuthMiddleware, geminiController_1.default.testPrompt);
router.post('/gemini/generate-sfl', authMiddleware_1.optionalAuthMiddleware, geminiController_1.default.generateSFLFromGoal);
router.post('/gemini/regenerate-sfl', authMiddleware_1.optionalAuthMiddleware, geminiController_1.default.regenerateSFLFromSuggestion);
router.post('/gemini/generate-workflow', authMiddleware_1.optionalAuthMiddleware, geminiController_1.default.generateWorkflowFromGoal);
// Provider validation routes (optional authentication for setup)
router.get('/providers/status', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.getProviderStatus);
router.get('/providers/available', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.getAvailableProviders);
router.get('/providers/health', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.checkProviderHealth);
router.get('/providers/preferred', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.getPreferredProvider);
router.post('/providers/validate', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.validateProvider);
// Secure API key management routes (optional authentication for setup)
router.post('/providers/save-key', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.saveApiKey);
router.delete('/providers/clear-keys', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.clearApiKeys);
router.get('/providers/stored-keys', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.getStoredKeys);
// AI proxy routes (optional authentication)
router.post('/proxy/generate', authMiddleware_1.optionalAuthMiddleware, providerController_1.default.proxyGenerate);
exports.default = router;
