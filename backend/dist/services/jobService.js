"use strict";
/**
 * @file jobService.ts
 * @description Job service that manages background workflow execution using BullMQ.
 * Provides functionality to add workflow execution jobs to a queue and process them
 * asynchronously. Integrates with the existing workflowExecutionService for actual execution.
 */
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
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("../config/env"));
const workflowExecutionService_1 = __importDefault(require("./workflowExecutionService"));
const promptService_1 = __importDefault(require("./promptService"));
const webSocketService_1 = __importDefault(require("./webSocketService"));
/**
 * Service class for managing workflow execution jobs using BullMQ
 */
class JobService {
    constructor() {
        if (!env_1.default.redisUrl) {
            console.warn('REDIS_URL environment variable not set, job service will be disabled');
            return;
        }
        try {
            // Initialize Redis connection with BullMQ-compatible settings
            this.redis = new ioredis_1.default(env_1.default.redisUrl, {
                maxRetriesPerRequest: null, // Required for BullMQ
                lazyConnect: true, // Don't connect immediately
            });
            // Initialize BullMQ queue
            this.queue = new bullmq_1.Queue('workflow-execution', {
                connection: this.redis,
                defaultJobOptions: {
                    removeOnComplete: 10, // Keep last 10 completed jobs
                    removeOnFail: 50, // Keep last 50 failed jobs
                    attempts: 3, // Retry failed jobs up to 3 times
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            });
            // Initialize BullMQ worker
            this.worker = new bullmq_1.Worker('workflow-execution', this.processWorkflowJob.bind(this), {
                connection: this.redis,
                concurrency: 5, // Process up to 5 jobs concurrently
            });
            // Set up worker event listeners
            this.setupWorkerEvents();
        }
        catch (error) {
            console.error('Failed to initialize job service:', error);
            throw error;
        }
    }
    /**
     * Adds a workflow execution job to the queue
     * @param workflowId - Unique identifier for the workflow
     * @param workflow - The workflow object to execute
     * @param userInput - Optional user input data
     * @returns Promise resolving to the job ID
     */
    addWorkflowJob(workflowId, workflow, userInput) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queue) {
                throw new Error('Job service not initialized - Redis connection not available');
            }
            const jobData = {
                workflowId,
                workflow,
                userInput,
            };
            const job = yield this.queue.add('execute-workflow', jobData, {
                jobId: `workflow-${workflowId}-${Date.now()}`,
            });
            return job.id;
        });
    }
    /**
     * Gets the status of a specific job
     * @param jobId - The job ID to check
     * @returns Promise resolving to job status information
     */
    getJobStatus(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queue) {
                throw new Error('Job service not initialized - Redis connection not available');
            }
            const job = yield this.queue.getJob(jobId);
            if (!job) {
                return null;
            }
            return {
                id: job.id,
                status: yield job.getState(),
                progress: job.progress,
                returnValue: job.returnvalue,
                failedReason: job.failedReason,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
            };
        });
    }
    /**
     * Processes a workflow execution job
     * @param job - The BullMQ job to process
     * @returns Promise resolving to the workflow execution result
     */
    processWorkflowJob(job) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workflowId, workflow, userInput } = job.data;
            try {
                // Update job progress
                yield job.updateProgress({ status: 'started', workflowId });
                // Get prompts needed for the workflow
                const promptIds = (workflow.tasks || [])
                    .filter(task => task.promptId)
                    .map(task => task.promptId);
                const prompts = [];
                for (const promptId of promptIds) {
                    const prompt = yield promptService_1.default.getPromptById(promptId);
                    if (prompt) {
                        prompts.push(prompt);
                    }
                }
                // Execute workflow tasks in order
                const results = {};
                const dataStore = { userInput: userInput || {} };
                // Simple sequential execution for now (will be enhanced with topological sort later)
                const tasks = workflow.tasks || [];
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    try {
                        // Update progress for current task
                        yield job.updateProgress({
                            status: 'active',
                            taskId: task.id,
                            taskName: task.name,
                            currentTask: i + 1,
                            totalTasks: tasks.length,
                        });
                        // Find the prompt for this task if it has one
                        const linkedPrompt = task.promptId
                            ? prompts.find(p => p.id === task.promptId)
                            : undefined;
                        // Execute the task
                        const result = yield workflowExecutionService_1.default.executeTask(task, dataStore, linkedPrompt);
                        // Store result in dataStore for next tasks
                        dataStore[task.outputKey] = result;
                        results[task.id] = result;
                        // Update progress for completed task
                        yield job.updateProgress({
                            status: 'completed',
                            taskId: task.id,
                            taskName: task.name,
                            result,
                        });
                    }
                    catch (error) {
                        // Update progress for failed task
                        yield job.updateProgress({
                            status: 'failed',
                            taskId: task.id,
                            taskName: task.name,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                        throw error; // Re-throw to fail the entire job
                    }
                }
                return {
                    workflowId,
                    status: 'completed',
                    results,
                    dataStore,
                };
            }
            catch (error) {
                console.error(`Workflow execution failed for ${workflowId}:`, error);
                throw error;
            }
        });
    }
    /**
     * Sets up event listeners for the worker
     */
    setupWorkerEvents() {
        if (!this.worker) {
            console.warn('Worker not initialized, skipping event setup');
            return;
        }
        this.worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed successfully`);
            // Broadcast completion to WebSocket clients
            webSocketService_1.default.broadcastToJob(job.id, {
                type: 'workflow_complete',
                workflowId: job.data.workflowId,
                status: 'completed',
                result: job.returnvalue,
            });
        });
        this.worker.on('failed', (job, error) => {
            console.error(`Job ${job === null || job === void 0 ? void 0 : job.id} failed:`, error.message);
            if (job === null || job === void 0 ? void 0 : job.id) {
                // Broadcast failure to WebSocket clients
                webSocketService_1.default.broadcastToJob(job.id, {
                    type: 'workflow_failed',
                    workflowId: job.data.workflowId,
                    status: 'failed',
                    error: error.message,
                });
            }
        });
        this.worker.on('active', (job) => {
            console.log(`Job ${job.id} started processing`);
            // Broadcast start to WebSocket clients
            webSocketService_1.default.broadcastToJob(job.id, {
                type: 'workflow_progress',
                workflowId: job.data.workflowId,
                status: 'running',
            });
        });
        this.worker.on('progress', (job, progress) => {
            // Type guard to ensure progress is a WorkflowJobProgress object
            if (typeof progress === 'object' && progress !== null &&
                'taskId' in progress && 'taskName' in progress && 'status' in progress) {
                const workflowProgress = progress;
                // Broadcast task progress to WebSocket clients
                webSocketService_1.default.broadcastToJob(job.id, {
                    type: 'task_status',
                    workflowId: job.data.workflowId,
                    taskId: workflowProgress.taskId,
                    taskName: workflowProgress.taskName,
                    status: workflowProgress.status,
                    result: workflowProgress.result,
                    error: workflowProgress.error,
                });
            }
        });
        this.worker.on('stalled', (jobId) => {
            console.warn(`Job ${jobId} stalled`);
        });
    }
    /**
     * Gracefully shuts down the job service
     */
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.worker) {
                yield this.worker.close();
            }
            if (this.queue) {
                yield this.queue.close();
            }
            if (this.redis) {
                yield this.redis.quit();
            }
        });
    }
}
exports.default = new JobService();
