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
const promptService_1 = __importDefault(require("../../services/promptService"));
/**
 * @class PromptController
 * @description Controller for handling prompt-related requests.
 */
class PromptController {
    /**
     * @method createPrompt
     * @description Creates a new prompt.
     * @param {Request} req - The Express request object, containing the prompt data in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    createPrompt(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Validate required fields
                if (!((_a = req.body.title) === null || _a === void 0 ? void 0 : _a.trim())) {
                    return res.status(400).json({ message: 'Title is required' });
                }
                if (!((_b = req.body.promptText) === null || _b === void 0 ? void 0 : _b.trim())) {
                    return res.status(400).json({ message: 'Prompt text is required' });
                }
                const prompt = yield promptService_1.default.createPrompt(req.body);
                res.status(201).json(prompt);
            }
            catch (error) {
                console.error('Create prompt error:', error);
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    next(error);
                }
            }
        });
    }
    /**
     * @method getPrompts
     * @description Retrieves a list of prompts, with optional filtering.
     * @param {Request} req - The Express request object, containing query parameters for filtering.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    getPrompts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prompts = yield promptService_1.default.getPrompts(req.query);
                res.status(200).json(prompts);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @method getPromptById
     * @description Retrieves a single prompt by its ID.
     * @param {Request} req - The Express request object, containing the prompt ID as a URL parameter.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    getPromptById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prompt = yield promptService_1.default.getPromptById(req.params.id);
                if (!prompt) {
                    return res.status(404).json({ message: 'Prompt not found' });
                }
                res.status(200).json(prompt);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @method updatePrompt
     * @description Updates an existing prompt.
     * @param {Request} req - The Express request object, containing the prompt ID as a URL parameter and the update data in the body.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    updatePrompt(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prompt = yield promptService_1.default.updatePrompt(req.params.id, req.body);
                if (!prompt) {
                    return res.status(404).json({ message: 'Prompt not found' });
                }
                res.status(200).json(prompt);
            }
            catch (error) {
                console.error('Update prompt error:', error);
                if (error instanceof Error) {
                    res.status(400).json({ message: error.message });
                }
                else {
                    next(error);
                }
            }
        });
    }
    /**
     * @method deletePrompt
     * @description Deletes a prompt by its ID.
     * @param {Request} req - The Express request object, containing the prompt ID as a URL parameter.
     * @param {Response} res - The Express response object.
     * @param {NextFunction} next - The Express next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    deletePrompt(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const success = yield promptService_1.default.deletePrompt(req.params.id);
                if (!success) {
                    return res.status(404).json({ message: 'Prompt not found' });
                }
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new PromptController();
