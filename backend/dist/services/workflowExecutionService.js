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
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable.");
}
const ai = new genai_1.GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });
const getNested = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};
const templateString = (template, dataStore) => {
    const singleVarMatch = template.trim().match(/^\{\{\s*([\w\.]+)\s*\}\}$/);
    if (singleVarMatch) {
        const key = singleVarMatch[1];
        const value = getNested(dataStore, key);
        return value !== undefined ? value : template;
    }
    return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, key) => {
        const value = getNested(dataStore, key);
        if (value === undefined || value === null) {
            console.warn(`Template key "${key}" not found in data store.`);
            return match;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    });
};
const executeGeminiPrompt = (prompt, agentConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const model = (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.model) || 'gemini-2.5-flash';
    const response = yield ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.temperature,
            topK: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.topK,
            topP: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.topP,
            systemInstruction: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.systemInstruction) ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        },
    });
    return ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
});
const executeImageAnalysis = (prompt, imagePart, agentConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const model = (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.model) || 'gemini-2.5-flash';
    const textPart = { text: prompt };
    const response = yield ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [textPart, imagePart] }],
        config: {
            temperature: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.temperature,
            systemInstruction: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.systemInstruction) ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        },
    });
    return ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
});
const executeGroundedGeneration = (prompt, agentConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const model = (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.model) || 'gemini-2.5-flash';
    const response = yield ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.systemInstruction) ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
            temperature: agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.temperature,
        }
    });
    const groundingChunks = ((_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.groundingMetadata) === null || _c === void 0 ? void 0 : _c.groundingChunks) || [];
    const sources = groundingChunks
        .map((chunk) => chunk.web)
        .filter((web) => web && web.uri);
    return {
        text: ((_h = (_g = (_f = (_e = (_d = response.candidates) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.parts) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.text) || "",
        sources: sources,
    };
});
const executeTextManipulation = (funcBody, inputs) => {
    try {
        const func = new Function('inputs', funcBody);
        return func(inputs);
    }
    catch (e) {
        throw new Error(`Error in custom function: ${e.message}`);
    }
};
class WorkflowExecutionService {
    executeTask(task, dataStore, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const inputs = {};
            for (const key of task.inputKeys) {
                inputs[key] = getNested(dataStore, key);
                if (inputs[key] === undefined) {
                    throw new Error(`Missing required input key "${key}" in data store for task "${task.name}".`);
                }
            }
            const resolvedInputs = task.inputKeys.reduce((acc, key) => {
                const simpleKey = key.split('.').pop() || key;
                acc[simpleKey] = getNested(dataStore, key);
                return acc;
            }, {});
            switch (task.type) {
                case 'DATA_INPUT':
                    if (task.staticValue && typeof task.staticValue === 'string') {
                        return templateString(task.staticValue, dataStore);
                    }
                    return task.staticValue;
                case 'GEMINI_PROMPT': {
                    if (task.promptId) {
                        if (!prompt) {
                            throw new Error(`Task "${task.name}" requires prompt ID "${task.promptId}" but no prompt was provided.`);
                        }
                        const linkedPrompt = prompt;
                        const { sflTenor, sflMode } = linkedPrompt;
                        const instructionParts = [];
                        if (sflTenor.aiPersona)
                            instructionParts.push(`You will act as a ${sflTenor.aiPersona}.`);
                        if (sflTenor.desiredTone)
                            instructionParts.push(`Your tone should be ${sflTenor.desiredTone}.`);
                        if ((_a = sflTenor.targetAudience) === null || _a === void 0 ? void 0 : _a.length)
                            instructionParts.push(`You are writing for ${sflTenor.targetAudience.join(', ')}.`);
                        if (sflMode.textualDirectives)
                            instructionParts.push(`Follow these directives: ${sflMode.textualDirectives}.`);
                        const systemInstruction = instructionParts.join(' ');
                        const finalPromptText = templateString(linkedPrompt.promptText, dataStore);
                        const finalAgentConfig = Object.assign(Object.assign({}, task.agentConfig), { systemInstruction });
                        return executeGeminiPrompt(finalPromptText, finalAgentConfig);
                    }
                    else {
                        if (!task.promptTemplate)
                            throw new Error("Prompt template is missing for non-linked prompt task.");
                        const finalPrompt = templateString(task.promptTemplate, dataStore);
                        return executeGeminiPrompt(finalPrompt, task.agentConfig);
                    }
                }
                case 'GEMINI_GROUNDED':
                    if (!task.promptTemplate)
                        throw new Error("Prompt template is missing.");
                    const groundedPrompt = templateString(task.promptTemplate, dataStore);
                    return executeGroundedGeneration(groundedPrompt, task.agentConfig);
                case 'IMAGE_ANALYSIS': {
                    if (!task.promptTemplate)
                        throw new Error("Prompt template is missing.");
                    const imageInputKey = task.inputKeys[0];
                    if (!imageInputKey) {
                        throw new Error("IMAGE_ANALYSIS task must have at least one input key pointing to the image data.");
                    }
                    const imageData = inputs[imageInputKey];
                    if (!imageData || typeof imageData.base64 !== 'string' || typeof imageData.type !== 'string') {
                        throw new Error(`Image data from key "${imageInputKey}" is missing, malformed, or not found in inputs.`);
                    }
                    const imagePart = {
                        inlineData: {
                            data: imageData.base64,
                            mimeType: imageData.type,
                        },
                    };
                    const analysisPrompt = templateString(task.promptTemplate, dataStore);
                    return executeImageAnalysis(analysisPrompt, imagePart, task.agentConfig);
                }
                case 'TEXT_MANIPULATION':
                    if (!task.functionBody)
                        throw new Error("Function body is missing.");
                    return executeTextManipulation(task.functionBody, resolvedInputs);
                default:
                    throw new Error(`Unsupported task type: ${task.type}`);
            }
        });
    }
}
exports.default = new WorkflowExecutionService();
