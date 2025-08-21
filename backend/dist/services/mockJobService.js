"use strict";
/**
 * Mock job service for development when Redis is not available.
 * Provides the same interface as the real JobService but doesn't require Redis.
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
Object.defineProperty(exports, "__esModule", { value: true });
class MockJobService {
    addWorkflowJob(workflowId, workflow, userInput) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Mock JobService: Would add workflow job', { workflowId, workflow: workflow.name });
            // Return a mock job ID
            return `mock-job-${Date.now()}`;
        });
    }
    getJobStatus(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Mock JobService: Would get job status for', jobId);
            // Return mock status
            return {
                id: jobId,
                status: 'mock-completed',
                data: { workflowId: 'mock-workflow' },
                result: { message: 'Mock job completed - Redis not available' },
            };
        });
    }
    // Add other methods as needed to match the real JobService interface
    shutdown() {
        console.log('Mock JobService: Shutdown called');
    }
}
exports.default = new MockJobService();
