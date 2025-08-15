"use strict";
/**
 * @file workflowController.ts
 * @description Controller for handling HTTP requests related to workflows.
 * Provides REST API endpoints for CRUD operations on workflow entities.
 * All methods follow Express.js controller patterns and include proper error handling.
 *
 * @requires express
 * @requires ../../services/workflowService
 * @since 0.5.1
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
const workflowService_1 = __importDefault(require("../../services/workflowService"));
const orchestratorService_1 = __importDefault(require("../../services/orchestratorService"));
/**
 * @class WorkflowController
 * @description Controller for handling workflow-related HTTP requests.
 * Provides REST API endpoints for creating, reading, updating, and deleting workflows.
 * Each method handles request validation, service calls, and appropriate HTTP responses.
 *
 * @since 0.5.1
 */
class WorkflowController {
    /**
     * Creates a new workflow from the request body.
     * Expects workflow data including name, user_id, and graph_data in the request body.
     *
     * @param {Request} req - The Express request object, containing the workflow data in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function for error handling.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     *
     * @throws {Error} Passes validation or database errors to the error handler middleware.
     *
     * @example
     * POST /api/workflows
     * Content-Type: application/json
     * {
     *   "user_id": "123e4567-e89b-12d3-a456-426614174000",
     *   "name": "Document Processing Workflow",
     *   "graph_data": { "tasks": [...], "connections": [...] }
     * }
     *
     * @since 0.5.1
     */
    createWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workflow = yield workflowService_1.default.createWorkflow(req.body);
                res.status(201).json(workflow);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves all workflows from the database.
     * Returns workflows ordered by most recently updated first.
     *
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function for error handling.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     *
     * @throws {Error} Passes database errors to the error handler middleware.
     *
     * @example
     * GET /api/workflows
     * Response: 200 OK
     * [
     *   {
     *     "id": "123e4567-e89b-12d3-a456-426614174000",
     *     "name": "Workflow 1",
     *     "graph_data": {...},
     *     "created_at": "2024-01-01T00:00:00Z",
     *     "updated_at": "2024-01-01T00:00:00Z"
     *   }
     * ]
     *
     * @since 0.5.1
     */
    getWorkflows(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workflows = yield workflowService_1.default.getWorkflows();
                res.status(200).json(workflows);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves a single workflow by its UUID.
     * Returns 404 if the workflow is not found.
     *
     * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function for error handling.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     *
     * @throws {Error} Passes database errors to the error handler middleware.
     *
     * @example
     * GET /api/workflows/123e4567-e89b-12d3-a456-426614174000
     * Response: 200 OK
     * {
     *   "id": "123e4567-e89b-12d3-a456-426614174000",
     *   "name": "My Workflow",
     *   "graph_data": {...}
     * }
     *
     * @since 0.5.1
     */
    getWorkflowById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workflow = yield workflowService_1.default.getWorkflowById(req.params.id);
                if (!workflow) {
                    return res.status(404).json({ message: 'Workflow not found' });
                }
                res.status(200).json(workflow);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Updates an existing workflow with partial data.
     * Performs a partial update, merging the request body with existing workflow data.
     * Returns 404 if the workflow is not found.
     *
     * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter and the update data in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function for error handling.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     *
     * @throws {Error} Passes validation or database errors to the error handler middleware.
     *
     * @example
     * PUT /api/workflows/123e4567-e89b-12d3-a456-426614174000
     * Content-Type: application/json
     * {
     *   "name": "Updated Workflow Name",
     *   "graph_data": { "tasks": [...] }
     * }
     *
     * @since 0.5.1
     */
    updateWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workflow = yield workflowService_1.default.updateWorkflow(req.params.id, req.body);
                if (!workflow) {
                    return res.status(404).json({ message: 'Workflow not found' });
                }
                res.status(200).json(workflow);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Deletes a workflow by its UUID.
     * Returns 404 if the workflow is not found, otherwise returns 204 No Content.
     *
     * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function for error handling.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     *
     * @throws {Error} Passes database errors to the error handler middleware.
     *
     * @example
     * DELETE /api/workflows/123e4567-e89b-12d3-a456-426614174000
     * Response: 204 No Content (if successful)
     * Response: 404 Not Found (if workflow doesn't exist)
     *
     * @since 0.5.1
     */
    deleteWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const success = yield workflowService_1.default.deleteWorkflow(req.params.id);
                if (!success) {
                    return res.status(404).json({ message: 'Workflow not found' });
                }
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Orchestrates a new workflow from a high-level user request using AI.
     * Takes a natural language description and automatically generates a complete,
     * executable workflow with proper task dependencies and data flow.
     *
     * @param {Request} req - The Express request object, containing the user request in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function for error handling.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     *
     * @throws {Error} Passes orchestration or validation errors to the error handler middleware.
     *
     * @example
     * POST /api/workflows/orchestrate
     * Content-Type: application/json
     * {
     *   "request": "Analyze customer feedback for sentiment and generate a summary report"
     * }
     *
     * Response: 200 OK
     * {
     *   "success": true,
     *   "workflow": {
     *     "id": "orchestrated-1234567890-abcdef",
     *     "name": "Customer Feedback Analysis",
     *     "description": "Analyzes customer feedback for sentiment...",
     *     "tasks": [...]
     *   }
     * }
     *
     * @since 2.1.0
     */
    orchestrateWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { request } = req.body;
                // Validate input
                if (!request || typeof request !== 'string') {
                    return res.status(400).json({
                        success: false,
                        error: 'Request body must contain a "request" field with a string description of the desired workflow.'
                    });
                }
                if (request.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'The request description cannot be empty.'
                    });
                }
                if (request.length > 2000) {
                    return res.status(400).json({
                        success: false,
                        error: 'The request description is too long. Please limit to 2000 characters.'
                    });
                }
                // Check if orchestrator service is configured
                if (!orchestratorService_1.default.isConfigured()) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI orchestration service is not properly configured. Please check the GEMINI_API_KEY environment variable.'
                    });
                }
                // Generate workflow using orchestrator service
                const result = yield orchestratorService_1.default.generateWorkflow(request.trim());
                if (!result.success) {
                    return res.status(422).json({
                        success: false,
                        error: result.error || 'Failed to generate workflow',
                        validationErrors: result.validationErrors
                    });
                }
                // Return the generated workflow
                res.status(200).json({
                    success: true,
                    workflow: result.workflow
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
/**
 * @exports {WorkflowController} workflowController
 * @description Singleton instance of the WorkflowController class, ready to be used in route definitions.
 * This exported instance provides all workflow-related HTTP request handlers.
 *
 * @since 0.5.1
 */
exports.default = new WorkflowController();
