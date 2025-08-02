"use strict";
/**
 * @file workflowService.ts
 * @description This service handles all business logic and database operations related to workflows.
 * It provides methods for creating, retrieving, updating, and deleting workflows.
 *
 * @requires ../config/database
 * @requires ../types
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
 */
class WorkflowService {
    /**
     * Creates a new workflow in the database.
     * @param {Omit<Workflow, 'id' | 'created_at' | 'updated_at'>} workflowData - The data for the new workflow.
     * @returns {Promise<Workflow>} A promise that resolves to the newly created workflow.
     */
    createWorkflow(workflowData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user_id, name, graph_data } = workflowData;
            const result = yield database_1.default.query('INSERT INTO workflows (user_id, name, graph_data) VALUES ($1, $2, $3) RETURNING *', [user_id, name, graph_data]);
            return result.rows[0];
        });
    }
    /**
     * Retrieves all workflows from the database.
     * @returns {Promise<Workflow[]>} A promise that resolves to an array of workflows.
     */
    getWorkflows() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('SELECT * FROM workflows ORDER BY updated_at DESC');
            return result.rows;
        });
    }
    /**
     * Retrieves a single workflow by its ID.
     * @param {string} id - The ID of the workflow to retrieve.
     * @returns {Promise<Workflow | null>} A promise that resolves to the workflow, or null if not found.
     */
    getWorkflowById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('SELECT * FROM workflows WHERE id = $1', [id]);
            return result.rows[0] || null;
        });
    }
    /**
     * Updates an existing workflow in the database.
     * @param {string} id - The ID of the workflow to update.
     * @param {Partial<Workflow>} workflowData - An object containing the fields to update.
     * @returns {Promise<Workflow | null>} A promise that resolves to the updated workflow, or null if not found.
     */
    updateWorkflow(id, workflowData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, graph_data } = workflowData;
            const result = yield database_1.default.query('UPDATE workflows SET name = $1, graph_data = $2, updated_at = now() WHERE id = $3 RETURNING *', [name, graph_data, id]);
            return result.rows[0] || null;
        });
    }
    /**
     * Deletes a workflow from the database.
     * @param {string} id - The ID of the workflow to delete.
     * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false otherwise.
     */
    deleteWorkflow(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('DELETE FROM workflows WHERE id = $1', [id]);
            return !!result.rowCount;
        });
    }
}
exports.default = new WorkflowService();
