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
const geminiService_1 = __importDefault(require("../../services/geminiService"));
class GeminiController {
    testPrompt(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { promptText } = req.body;
                if (!promptText) {
                    return res.status(400).json({ message: 'promptText is required' });
                }
                const result = yield geminiService_1.default.testPrompt(promptText);
                res.status(200).json({ text: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    generateSFLFromGoal(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('POST /api/gemini/generate-sfl received');
                console.log('Request body:', JSON.stringify(req.body, null, 2));
                const { goal, sourceDocContent } = req.body;
                if (!goal) {
                    console.log('Error: Goal is required but not provided');
                    return res.status(400).json({ message: 'Goal is required' });
                }
                console.log('Calling GeminiService.generateSFLFromGoal...');
                const result = yield geminiService_1.default.generateSFLFromGoal(goal, sourceDocContent);
                console.log('Generated SFL result:', JSON.stringify(result, null, 2));
                res.status(200).json(result);
            }
            catch (error) {
                console.error('Error in generateSFLFromGoal controller:', error);
                next(error);
            }
        });
    }
    regenerateSFLFromSuggestion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { currentPrompt, suggestion } = req.body;
                if (!currentPrompt || !suggestion) {
                    return res.status(400).json({ message: 'Current prompt and suggestion are required' });
                }
                const result = yield geminiService_1.default.regenerateSFLFromSuggestion(currentPrompt, suggestion);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    generateWorkflowFromGoal(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { goal } = req.body;
                if (!goal) {
                    return res.status(400).json({ message: 'Goal is required' });
                }
                const result = yield geminiService_1.default.generateWorkflowFromGoal(goal);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new GeminiController();
