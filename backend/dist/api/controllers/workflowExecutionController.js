"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const workflowExecutionService_1 = __importDefault(require("../../services/workflowExecutionService"));
const promptService_1 = __importDefault(require("../../services/promptService"));
// Conditionally import job service based on Redis availability
let JobService;
try {
    // Try to import the real job service
    JobService = require('../../services/jobService').default;
}
catch (error) {
    console.warn('Redis not available, using mock job service');
    JobService = require('../../services/mockJobService').default;
}
class WorkflowExecutionController {
    runTask(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { task, dataStore } = req.body;
                if (!task || !dataStore) {
                    return res.status(400).json({ message: 'Task and dataStore are required' });
                }
                // Optimize: Only fetch the specific prompt if needed, instead of all prompts
                let linkedPrompt;
                if (task.promptId) {
                    const foundPrompt = yield promptService_1.default.getPromptById(task.promptId);
                    if (!foundPrompt) {
                        return res.status(404).json({ message: `Prompt with ID ${task.promptId} not found` });
                    }
                    linkedPrompt = foundPrompt;
                }
                const result = yield workflowExecutionService_1.default.executeTask(task, dataStore, linkedPrompt);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    executeWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { workflow, userInput } = req.body;
                if (!workflow) {
                    return res.status(400).json({ message: 'Workflow is required' });
                }
                if (!workflow.id) {
                    return res.status(400).json({ message: 'Workflow must have an ID' });
                }
                // Add workflow to execution queue
                const jobId = yield JobService.addWorkflowJob(workflow.id, workflow, userInput);
                // Return immediately with job ID and pending status
                res.status(202).json({
                    jobId,
                    status: 'pending',
                    message: 'Workflow execution started. Use the job ID to check status.'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getJobStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { jobId } = req.params;
                if (!jobId) {
                    return res.status(400).json({ message: 'Job ID is required' });
                }
                const jobStatus = yield JobService.getJobStatus(jobId);
                if (!jobStatus) {
                    return res.status(404).json({ message: 'Job not found' });
                }
                res.status(200).json(jobStatus);
            }
            catch (error) {
                next(error);
            }
        });
    }
    stopWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { jobId } = req.params;
                if (!jobId) {
                    return res.status(400).json({ message: 'Job ID is required' });
                }
                const success = yield JobService.stopJob(jobId);
                if (!success) {
                    return res.status(404).json({ message: 'Job not found or already completed' });
                }
                res.status(200).json({
                    message: 'Workflow stop requested successfully',
                    jobId
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new WorkflowExecutionController();
