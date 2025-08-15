/**
 * Mock job service for development when Redis is not available.
 * Provides the same interface as the real JobService but doesn't require Redis.
 */

import { Workflow } from '../types';

interface WorkflowJobData {
  workflowId: string;
  workflow: Workflow;
  userInput?: Record<string, any>;
}

class MockJobService {
  async addWorkflowJob(workflowId: string, workflow: Workflow, userInput?: Record<string, any>): Promise<string> {
    console.log('Mock JobService: Would add workflow job', { workflowId, workflow: workflow.name });
    // Return a mock job ID
    return `mock-job-${Date.now()}`;
  }

  async getJobStatus(jobId: string): Promise<any> {
    console.log('Mock JobService: Would get job status for', jobId);
    // Return mock status
    return {
      id: jobId,
      status: 'mock-completed',
      data: { workflowId: 'mock-workflow' },
      result: { message: 'Mock job completed - Redis not available' },
    };
  }

  // Add other methods as needed to match the real JobService interface
  shutdown(): void {
    console.log('Mock JobService: Shutdown called');
  }
}

export default new MockJobService();