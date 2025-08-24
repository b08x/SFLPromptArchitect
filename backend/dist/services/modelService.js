"use strict";
/**
 * @file modelService.ts
 * @description This service handles database operations related to AI models.
 * It provides methods to retrieve information about the available models that can be used
 * for workflow tasks and prompt testing. Models are stored in the database with metadata
 * about their capabilities and availability.
 *
 * @requires ../config/database
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
 * @class ModelService
 * @description A class to encapsulate all database logic for AI models.
 * Provides methods to retrieve model information for use in workflow configuration
 * and prompt testing interfaces.
 *
 * @since 0.5.1
 */
class ModelService {
    /**
     * Retrieves all active models from the database.
     * Returns only models that are currently available for use, ordered alphabetically by name.
     *
     * @returns {Promise<Model[]>} A promise that resolves to an array of active models.
     *
     * @example
     * ```typescript
     * const availableModels = await modelService.getModels();
     * console.log('Available models:');
     * availableModels.forEach(model => {
     *   console.log(`- ${model.name}: ${model.description || 'No description'}`);
     * });
     * ```
     *
     * @since 0.5.1
     */
    getModels() {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield (0, database_1.default)();
            const result = yield pool.query('SELECT * FROM models WHERE is_active = true ORDER BY name');
            return result.rows;
        });
    }
}
/**
 * @exports {ModelService} modelService
 * @description Singleton instance of the ModelService class, ready to be used across the application.
 * This exported instance provides all model-related database operations.
 *
 * @since 0.5.1
 */
exports.default = new ModelService();
