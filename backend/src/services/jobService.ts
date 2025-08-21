/**
 * @file jobService.ts
 * @description Job service that manages background workflow execution using BullMQ.
 * Provides functionality to add workflow execution jobs to a queue and process them
 * asynchronously. Integrates with the existing workflowExecutionService for actual execution.
 */

import { Queue, Worker, Job, JobProgress } from 'bullmq';
import Redis from 'ioredis';
import config from '../config/env';
import workflowExecutionService from './workflowExecutionService';
import promptService from './promptService';
import webSocketService from './webSocketService';
import { Workflow, Task, PromptSFL } from '../types';

/**
 * @interface WorkflowJobData
 * @description Structure of data passed to workflow execution jobs
 */
interface WorkflowJobData {
  workflowId: string;
  workflow: Workflow;
  userInput?: Record<string, any>;
}

/**
 * @interface WorkflowJobProgress
 * @description Structure for job progress updates
 */
interface WorkflowJobProgress {
  taskId: string;
  taskName: string;
  status: 'active' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Service class for managing workflow execution jobs using BullMQ
 */
class JobService {
  private queue?: Queue;
  private worker?: Worker;
  private redis?: Redis;

  constructor() {
    if (!config.redisUrl) {
      console.warn('REDIS_URL environment variable not set, job service will be disabled');
      return;
    }

    try {
      // Initialize Redis connection with BullMQ-compatible settings
      this.redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
        lazyConnect: true, // Don't connect immediately
      });

      // Initialize BullMQ queue
      this.queue = new Queue('workflow-execution', {
        connection: this.redis,
        defaultJobOptions: {
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 50,     // Keep last 50 failed jobs
          attempts: 3,          // Retry failed jobs up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Initialize BullMQ worker
      this.worker = new Worker('workflow-execution', this.processWorkflowJob.bind(this), {
        connection: this.redis,
        concurrency: 5, // Process up to 5 jobs concurrently
      });

      // Set up worker event listeners
      this.setupWorkerEvents();
    } catch (error) {
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
  async addWorkflowJob(
    workflowId: string, 
    workflow: Workflow, 
    userInput?: Record<string, any>
  ): Promise<string> {
    if (!this.queue) {
      throw new Error('Job service not initialized - Redis connection not available');
    }

    const jobData: WorkflowJobData = {
      workflowId,
      workflow,
      userInput,
    };

    const job = await this.queue.add('execute-workflow', jobData, {
      jobId: `workflow-${workflowId}-${Date.now()}`,
    });

    return job.id!;
  }

  /**
   * Gets the status of a specific job
   * @param jobId - The job ID to check
   * @returns Promise resolving to job status information
   */
  async getJobStatus(jobId: string) {
    if (!this.queue) {
      throw new Error('Job service not initialized - Redis connection not available');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Processes a workflow execution job
   * @param job - The BullMQ job to process
   * @returns Promise resolving to the workflow execution result
   */
  private async processWorkflowJob(job: Job<WorkflowJobData>): Promise<any> {
    const { workflowId, workflow, userInput } = job.data;

    try {
      // Update job progress
      await job.updateProgress({ status: 'started', workflowId });

      // Get prompts needed for the workflow
      const promptIds = (workflow.tasks || [])
        .filter(task => task.promptId)
        .map(task => task.promptId!);
      
      const prompts: PromptSFL[] = [];
      for (const promptId of promptIds) {
        const prompt = await promptService.getPromptById(promptId);
        if (prompt) {
          prompts.push(prompt);
        }
      }

      // Execute workflow tasks in order
      const results: Record<string, any> = {};
      const dataStore: Record<string, any> = { userInput: userInput || {} };

      // Simple sequential execution for now (will be enhanced with topological sort later)
      const tasks = workflow.tasks || [];
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        try {
          // Update progress for current task
          await job.updateProgress({
            status: 'active',
            taskId: task.id,
            taskName: task.name,
            currentTask: i + 1,
            totalTasks: tasks.length,
          } as WorkflowJobProgress);

          // Find the prompt for this task if it has one
          const linkedPrompt = task.promptId 
            ? prompts.find(p => p.id === task.promptId)
            : undefined;

          // Execute the task
          const result = await workflowExecutionService.executeTask(task, dataStore, linkedPrompt);
          
          // Store result in dataStore for next tasks
          dataStore[task.outputKey] = result;
          results[task.id] = result;

          // Update progress for completed task
          await job.updateProgress({
            status: 'completed',
            taskId: task.id,
            taskName: task.name,
            result,
          } as WorkflowJobProgress);

        } catch (error) {
          // Update progress for failed task
          await job.updateProgress({
            status: 'failed',
            taskId: task.id,
            taskName: task.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as WorkflowJobProgress);

          throw error; // Re-throw to fail the entire job
        }
      }

      return {
        workflowId,
        status: 'completed',
        results,
        dataStore,
      };

    } catch (error) {
      console.error(`Workflow execution failed for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Sets up event listeners for the worker
   */
  private setupWorkerEvents(): void {
    if (!this.worker) {
      console.warn('Worker not initialized, skipping event setup');
      return;
    }

    this.worker.on('completed', (job: Job) => {
      console.log(`Job ${job.id} completed successfully`);
      
      // Broadcast completion to WebSocket clients
      webSocketService.broadcastToJob(job.id!, {
        type: 'workflow_complete',
        workflowId: job.data.workflowId,
        status: 'completed',
        result: job.returnvalue,
      });
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Job ${job?.id} failed:`, error.message);
      
      if (job?.id) {
        // Broadcast failure to WebSocket clients
        webSocketService.broadcastToJob(job.id, {
          type: 'workflow_failed',
          workflowId: job.data.workflowId,
          status: 'failed',
          error: error.message,
        });
      }
    });

    this.worker.on('active', (job: Job) => {
      console.log(`Job ${job.id} started processing`);
      
      // Broadcast start to WebSocket clients
      webSocketService.broadcastToJob(job.id!, {
        type: 'workflow_progress',
        workflowId: job.data.workflowId,
        status: 'running',
      });
    });

    this.worker.on('progress', (job: Job, progress: JobProgress) => {
      // Type guard to ensure progress is a WorkflowJobProgress object
      if (typeof progress === 'object' && progress !== null && 
          'taskId' in progress && 'taskName' in progress && 'status' in progress) {
        const workflowProgress = progress as WorkflowJobProgress;
        
        // Broadcast task progress to WebSocket clients
        webSocketService.broadcastToJob(job.id!, {
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

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`Job ${jobId} stalled`);
    });
  }

  /**
   * Gracefully shuts down the job service
   */
  async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default new JobService();