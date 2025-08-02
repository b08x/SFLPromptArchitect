"use strict";
/**
 * @file modelService.ts
 * @description This service handles database operations related to AI models.
 * It provides methods to retrieve information about the available models.
 *
 * @requires ../config/database
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
 */
class ModelService {
    /**
     * Retrieves all active models from the database.
     * @returns {Promise<Model[]>} A promise that resolves to an array of active models.
     */
    getModels() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query('SELECT * FROM models WHERE is_active = true ORDER BY name');
            return result.rows;
        });
    }
}
exports.default = new ModelService();
