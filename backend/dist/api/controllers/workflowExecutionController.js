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
const workflowExecutionService_1 = __importDefault(require("../../services/workflowExecutionService"));
const promptService_1 = __importDefault(require("../../services/promptService"));
class WorkflowExecutionController {
    runTask(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { task, dataStore } = req.body;
                if (!task || !dataStore) {
                    return res.status(400).json({ message: 'Task and dataStore are required' });
                }
                // We need to fetch all prompts to be able to find the linked prompt
                const prompts = yield promptService_1.default.getPrompts({});
                const result = yield workflowExecutionService_1.default.executeTask(task, dataStore, prompts);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new WorkflowExecutionController();
