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
const workflowService_1 = __importDefault(require("../../services/workflowService"));
/**
 * @class WorkflowController
 * @description Controller for handling workflow-related requests.
 */
class WorkflowController {
    /**
     * @method createWorkflow
     * @description Creates a new workflow.
     * @param {Request} req - The Express request object, containing the workflow data in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
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
     * @method getWorkflows
     * @description Retrieves a list of all workflows.
     * @param {Request} req - The Express request object.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
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
     * @method getWorkflowById
     * @description Retrieves a single workflow by its ID.
     * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
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
     * @method updateWorkflow
     * @description Updates an existing workflow.
     * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter and the update data in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    updateWorkflow(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workflow = yield workflowService_1.default.updateWorkflow(req.params.id, req.body);
                if (!workflow) {
                    return res.status(44).json({ message: 'Workflow not found' });
                }
                res.status(200).json(workflow);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @method deleteWorkflow
     * @description Deletes a workflow by its ID.
     * @param {Request} req - The Express request object, containing the workflow ID as a URL parameter.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
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
}
exports.default = new WorkflowController();
