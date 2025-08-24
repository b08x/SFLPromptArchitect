"use strict";
/**
 * @file workflowService.ts
 * @description This service handles all business logic and database operations related to workflows.
 * It provides methods for creating, retrieving, updating, and deleting workflows.
 * Workflows contain task definitions and their execution logic stored as JSON in the graph_data column.
 *
 * @requires ../config/database
 * @requires ../types
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
const database_1 = __importDefault(require("../config/database"));
/**
 * @class WorkflowService
 * @description A class to encapsulate all business logic for workflows.
 * Provides CRUD operations for workflows and handles the complex graph_data structure
 * that defines the workflow's tasks and their relationships.
 *
 * @since 0.5.1
 */
class WorkflowService {
    /**
     * Creates a new workflow in the database.
     * Stores the workflow definition including its task graph structure.
     *
     * @param {Omit<Workflow, 'id' | 'created_at' | 'updated_at'>} workflowData - The data for the new workflow.
     * @returns {Promise<Workflow>} A promise that resolves to the newly created workflow.
     * @throws {Error} If required fields are missing or database operation fails.
     *
     * @example
     * ```typescript
     * const newWorkflow = {
     *   user_id: '123e4567-e89b-12d3-a456-426614174000',
     *   name: 'Document Analysis Workflow',
     *   graph_data: {
     *     tasks: [...],
     *     connections: [...]
     *   }
     * };
     * const created = await workflowService.createWorkflow(newWorkflow);
     * ```
     *
     * @since 0.5.1
     */
    createWorkflow(workflowData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user_id, name, graph_data } = workflowData;
            const pool = yield (0, database_1.default)();
            const result = yield pool.query('INSERT INTO workflows (user_id, name, graph_data) VALUES ($1, $2, $3) RETURNING *', [user_id, name, graph_data]);
            return result.rows[0];
        });
    }
    /**
     * Retrieves all workflows from the database.
     * Returns workflows ordered by most recently updated first.
     *
     * @returns {Promise<Workflow[]>} A promise that resolves to an array of workflows.
     *
     * @example
     * ```typescript
     * const allWorkflows = await workflowService.getWorkflows();
     * console.log(`Found ${allWorkflows.length} workflows`);
     * allWorkflows.forEach(wf => console.log(`- ${wf.name}`));
     * ```
     *
     * @since 0.5.1
     */
    getWorkflows() {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield (0, database_1.default)();
            const result = yield pool.query('SELECT * FROM workflows ORDER BY updated_at DESC');
            return result.rows;
        });
    }
    /**
     * Retrieves a single workflow by its ID.
     *
     * @param {string} id - The UUID of the workflow to retrieve.
     * @returns {Promise<Workflow | null>} A promise that resolves to the workflow, or null if not found.
     *
     * @example
     * ```typescript
     * const workflow = await workflowService.getWorkflowById('123e4567-e89b-12d3-a456-426614174000');
     * if (workflow) {
     *   console.log(`Found workflow: ${workflow.name}`);
     *   console.log(`Tasks: ${workflow.graph_data.tasks?.length || 0}`);
     * }
     * ```
     *
     * @since 0.5.1
     */
    getWorkflowById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield (0, database_1.default)();
            const result = yield pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
            return result.rows[0] || null;
        });
    }
    /**
     * Updates an existing workflow in the database.
     * Performs partial updates by merging the provided data with existing workflow.
     * Preserves existing data for fields not specified in the update.
     *
     * @param {string} id - The UUID of the workflow to update.
     * @param {Partial<Workflow>} workflowData - An object containing the fields to update.
     * @returns {Promise<Workflow | null>} A promise that resolves to the updated workflow, or null if not found.
     *
     * @example
     * ```typescript
     * const updates = {
     *   name: 'Updated Workflow Name',
     *   graph_data: {
     *     ...existingGraphData,
     *     tasks: [...modifiedTasks]
     *   }
     * };
     * const updated = await workflowService.updateWorkflow(workflowId, updates);
     * ```
     *
     * @since 0.5.1
     */
    updateWorkflow(id, workflowData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // First, fetch the existing workflow from the database
            const pool = yield (0, database_1.default)();
            const existing = yield pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
            if (!existing.rows[0])
                return null;
            // Create a merged object by combining existing data with new data
            const name = (_a = workflowData.name) !== null && _a !== void 0 ? _a : existing.rows[0].name;
            const graph_data = (_b = workflowData.graph_data) !== null && _b !== void 0 ? _b : existing.rows[0].graph_data;
            // Update with the merged values to ensure partial updates don't overwrite existing data
            const result = yield pool.query('UPDATE workflows SET name = $1, graph_data = $2, updated_at = now() WHERE id = $3 RETURNING *', [name, graph_data, id]);
            return result.rows[0] || null;
        });
    }
    /**
     * Deletes a workflow from the database.
     *
     * @param {string} id - The UUID of the workflow to delete.
     * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false if the workflow was not found.
     *
     * @example
     * ```typescript
     * const deleted = await workflowService.deleteWorkflow('123e4567-e89b-12d3-a456-426614174000');
     * if (deleted) {
     *   console.log('Workflow successfully deleted');
     * } else {
     *   console.log('Workflow not found');
     * }
     * ```
     *
     * @since 0.5.1
     */
    deleteWorkflow(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield (0, database_1.default)();
            const result = yield pool.query('DELETE FROM workflows WHERE id = $1', [id]);
            return !!result.rowCount;
        });
    }
}
/**
 * @exports {WorkflowService} workflowService
 * @description Singleton instance of the WorkflowService class, ready to be used across the application.
 * This exported instance provides all workflow-related database operations.
 *
 * @since 0.5.1
 */
exports.default = new WorkflowService();
