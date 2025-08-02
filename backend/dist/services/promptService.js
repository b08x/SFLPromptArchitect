"use strict";
/**
 * @file promptService.ts
 * @description This service handles all business logic and database operations related to prompts.
 * It includes functions for creating, retrieving, updating, and deleting prompts,
 * as well as mapping between the SFL prompt format used in the frontend and the database schema.
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
 * @class PromptService
 * @description A class to encapsulate all business logic for prompts.
 */
class PromptService {
    /**
     * Maps the detailed `PromptSFL` format to the database `Prompt` format.
     * @param {PromptSFL | Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>} sflData - The SFL prompt data.
     * @returns {Omit<Prompt, 'id' | 'created_at' | 'updated_at'>} The prompt data formatted for the database.
     * @private
     */
    mapSFLToPrompt(sflData) {
        const metadata = {
            sflField: sflData.sflField,
            sflTenor: sflData.sflTenor,
            sflMode: sflData.sflMode,
            exampleOutput: sflData.exampleOutput,
            notes: sflData.notes,
            sourceDocument: sflData.sourceDocument,
        };
        return {
            user_id: '79e06398-14dc-4d4c-b2b2-7611e742172c', // TODO: Replace with actual user ID from authentication
            title: sflData.title || 'Untitled Prompt',
            body: sflData.promptText || '',
            metadata,
        };
    }
    /**
     * Maps a database `Prompt` record to the `PromptSFL` format.
     * @param {Prompt} dbPrompt - The prompt record from the database.
     * @returns {PromptSFL} The prompt data in the SFL format.
     * @private
     */
    mapPromptToSFL(dbPrompt) {
        const metadata = dbPrompt.metadata || {};
        return {
            id: dbPrompt.id,
            title: dbPrompt.title,
            promptText: dbPrompt.body,
            createdAt: dbPrompt.created_at,
            updatedAt: dbPrompt.updated_at,
            sflField: metadata.sflField || { topic: '', taskType: '', domainSpecifics: '', keywords: '' },
            sflTenor: metadata.sflTenor || { aiPersona: '', targetAudience: [], desiredTone: '', interpersonalStance: '' },
            sflMode: metadata.sflMode || { outputFormat: '', rhetoricalStructure: '', lengthConstraint: '', textualDirectives: '' },
            exampleOutput: metadata.exampleOutput,
            notes: metadata.notes,
            sourceDocument: metadata.sourceDocument,
        };
    }
    /**
     * Creates a new prompt in the database.
     * @param {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>} promptData - The SFL data for the new prompt.
     * @returns {Promise<PromptSFL>} A promise that resolves to the newly created prompt.
     * @throws {Error} If the title or prompt text is empty.
     */
    createPrompt(promptData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!((_a = promptData.title) === null || _a === void 0 ? void 0 : _a.trim())) {
                throw new Error('Title is required');
            }
            if (!((_b = promptData.promptText) === null || _b === void 0 ? void 0 : _b.trim())) {
                throw new Error('Prompt text is required');
            }
            const mappedData = this.mapSFLToPrompt(promptData);
            const result = yield database_1.default.query('INSERT INTO prompts (user_id, title, body, metadata) VALUES ($1, $2, $3, $4) RETURNING *', [mappedData.user_id, mappedData.title, mappedData.body, mappedData.metadata]);
            return this.mapPromptToSFL(result.rows[0]);
        });
    }
    /**
     * Retrieves all prompts from the database.
     * @param {any} filters - An object containing filter criteria (currently unused).
     * @returns {Promise<PromptSFL[]>} A promise that resolves to an array of prompts.
     */
    getPrompts(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('SELECT * FROM prompts ORDER BY updated_at DESC');
            return result.rows.map(row => this.mapPromptToSFL(row));
        });
    }
    /**
     * Retrieves a single prompt by its ID.
     * @param {string} id - The ID of the prompt to retrieve.
     * @returns {Promise<PromptSFL | null>} A promise that resolves to the prompt, or null if not found.
     */
    getPromptById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('SELECT * FROM prompts WHERE id = $1', [id]);
            if (!result.rows[0])
                return null;
            return this.mapPromptToSFL(result.rows[0]);
        });
    }
    /**
     * Updates an existing prompt in the database.
     * @param {string} id - The ID of the prompt to update.
     * @param {Partial<PromptSFL>} promptData - An object containing the fields to update.
     * @returns {Promise<PromptSFL | null>} A promise that resolves to the updated prompt, or null if not found.
     * @throws {Error} If the title or prompt text is being updated to an empty value.
     */
    updatePrompt(id, promptData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (promptData.title !== undefined && !((_a = promptData.title) === null || _a === void 0 ? void 0 : _a.trim())) {
                throw new Error('Title cannot be empty');
            }
            if (promptData.promptText !== undefined && !((_b = promptData.promptText) === null || _b === void 0 ? void 0 : _b.trim())) {
                throw new Error('Prompt text cannot be empty');
            }
            const existing = yield database_1.default.query('SELECT * FROM prompts WHERE id = $1', [id]);
            if (!existing.rows[0])
                return null;
            const existingSFL = this.mapPromptToSFL(existing.rows[0]);
            const updatedSFL = Object.assign(Object.assign({}, existingSFL), promptData);
            const mappedData = this.mapSFLToPrompt(updatedSFL);
            const result = yield database_1.default.query('UPDATE prompts SET title = $1, body = $2, metadata = $3, updated_at = now() WHERE id = $4 RETURNING *', [mappedData.title, mappedData.body, mappedData.metadata, id]);
            return result.rows[0] ? this.mapPromptToSFL(result.rows[0]) : null;
        });
    }
    /**
     * Deletes a prompt from the database.
     * @param {string} id - The ID of the prompt to delete.
     * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful, false otherwise.
     */
    deletePrompt(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('DELETE FROM prompts WHERE id = $1', [id]);
            return !!result.rowCount;
        });
    }
}
exports.default = new PromptService();
