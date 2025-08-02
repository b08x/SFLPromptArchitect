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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable.");
}
const ai = new genai_1.GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });
const parseJsonFromText = (text) => {
    const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
    const match = text.match(fenceRegex);
    let jsonStr = text.trim();
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }
    else {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
    }
    try {
        return JSON.parse(jsonStr);
    }
    catch (e) {
        console.error("Failed to parse JSON response:", e, "Raw text:", text);
        throw new Error("The AI returned a response that was not valid JSON.");
    }
};
class GeminiService {
    testPrompt(promptText) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!API_KEY) {
                throw new Error("Gemini API Key is not configured.");
            }
            try {
                const response = yield ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: "user", parts: [{ text: promptText }] }],
                });
                return ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
            }
            catch (error) {
                console.error("Error calling Gemini API:", error);
                if (error instanceof Error) {
                    throw new Error(`Gemini API Error: ${error.message}`);
                }
                throw new Error("An unknown error occurred while contacting the Gemini API.");
            }
        });
    }
    generateSFLFromGoal(goal, sourceDocContent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!API_KEY) {
                throw new Error("Gemini API Key is not configured.");
            }
            const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's goal and structure it into a detailed SFL-based prompt.\n    If a source document is provided for stylistic reference, you MUST analyze its style (e.g., tone, complexity, vocabulary, sentence structure) and incorporate those stylistic qualities into the SFL fields and the final promptText. For example, update the 'desiredTone', 'aiPersona', and 'textualDirectives' to match the source. The generated 'promptText' should be a complete, standalone prompt that implicitly carries the desired style.\n    The output MUST be a single, valid JSON object. Do not include any text, notes, or explanations outside of the JSON object.\n    The JSON object should have the following structure: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string }.\n    \n    - title: Create a concise, descriptive title based on the user's goal.\n    - promptText: Synthesize all the SFL elements into a complete, well-formed prompt that can be sent directly to an AI.\n    - sflField (What is happening?): Analyze the subject matter.\n    - sflTenor (Who is taking part?): Define the roles and relationships. The "targetAudience" field must be an array of strings, even if only one audience is identified.\n    - sflMode (How is it being communicated?): Specify the format and structure of the output.\n    - exampleOutput: Provide a brief but illustrative example of the expected output.\n    - notes: Add any relevant notes or suggestions for the user.\n    - All fields in the JSON must be filled with meaningful content.`;
            const userContent = sourceDocContent
                ? `Source document for style reference:\n\n---\n\n${sourceDocContent}\n\n----\n\nUser's goal: "${goal}"`
                : `Here is the user's goal: "${goal}"`;
            try {
                const response = yield ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: "user", parts: [{ text: userContent }] }],
                    config: {
                        responseMimeType: "application/json",
                        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
                    },
                });
                const text = ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "{}";
                const jsonData = parseJsonFromText(text);
                if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
                    jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
                }
                if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
                    jsonData.sflTenor.targetAudience = [];
                }
                return jsonData;
            }
            catch (error) {
                console.error("Error calling Gemini API for SFL generation:", error);
                if (error instanceof Error) {
                    throw new Error(`Gemini API Error: ${error.message}`);
                }
                throw new Error("An unknown error occurred while generating the SFL prompt.");
            }
        });
    }
    regenerateSFLFromSuggestion(currentPrompt, suggestion) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!API_KEY) {
                throw new Error("Gemini API Key is not configured.");
            }
            const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to revise an existing SFL prompt based on a user's suggestion.\n    The user will provide a JSON object representing the current prompt and a text string with their requested change.\n    If a source document is provided (as part of the prompt object or separately), its style should be analyzed and take precedence, influencing the revision.\n    You MUST return a single, valid JSON object that represents the *revised* prompt. Do not include any text, notes, or explanations outside of the JSON object.\n    The output JSON object must have the exact same structure as the input, containing all the original fields, but with values updated according to the suggestion and stylistic source.\n    The structure is: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string, "sourceDocument": { "name": string, "content": string } | undefined }.\n    \n    - Critically analyze the user's suggestion and apply it to all relevant fields in the prompt.\n    - If a 'sourceDocument' is present, ensure its style is reflected in the revised SFL fields and 'promptText'.\n    - The 'promptText' field is the most important; it must be re-written to reflect the change.\n    - Other SFL fields (Field, Tenor, Mode) should be updated logically to align with the new 'promptText' and the user's suggestion.\n    - Even update the 'title', 'exampleOutput', and 'notes' if the suggestion implies it.\n    - Ensure 'targetAudience' remains an array of strings.\n    - Preserve the 'sourceDocument' field in the output if it existed in the input.`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { sourceDocument } = currentPrompt, promptForPayload = __rest(currentPrompt, ["sourceDocument"]);
            const userContent = `
    Here is the current prompt JSON:
    ${JSON.stringify(promptForPayload)}
    
    ${sourceDocument ? `This prompt is associated with the following source document for stylistic reference:\n---\n${sourceDocument.content}\n---\n` : ''}

    Here is my suggestion for how to change it:
    "${suggestion}"

    Now, provide the complete, revised JSON object.
    `;
            try {
                const response = yield ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: "user", parts: [{ text: userContent }] }],
                    config: {
                        responseMimeType: "application/json",
                        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
                    },
                });
                const text = ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "{}";
                const jsonData = parseJsonFromText(text);
                if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
                    jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
                }
                if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
                    jsonData.sflTenor.targetAudience = [];
                }
                // Preserve the source document from the original prompt
                jsonData.sourceDocument = sourceDocument;
                return jsonData;
            }
            catch (error) {
                console.error("Error calling Gemini API for SFL regeneration:", error);
                if (error instanceof Error) {
                    throw new Error(`Gemini API Error: ${error.message}`);
                }
                throw new Error("An unknown error occurred while regenerating the SFL prompt.");
            }
        });
    }
    generateWorkflowFromGoal(goal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!API_KEY) {
                throw new Error("Gemini API Key is not configured.");
            }
            const systemInstruction = `You are an expert AI workflow orchestrator. Your task is to analyze a user's goal and generate a complete, multi-task workflow as a valid JSON object.\n    \nThe user goal will be provided. Based on this, create a workflow with a series of tasks. The output MUST be a single, valid JSON object representing the workflow. Do not include any text or explanations outside the JSON.\n\nThe root JSON object must have 'name', 'description', and 'tasks' fields. Each task in the 'tasks' array must have the following fields:\n- id: A unique string identifier for the task (e.g., "task-1").\n- name: A short, descriptive name for the task.\n- description: A one-sentence explanation of what the task does.\n- type: One of "DATA_INPUT", "GEMINI_PROMPT", "IMAGE_ANALYSIS", "TEXT_MANIPULATION", "DISPLAY_CHART", "GEMINI_GROUNDED".\n- dependencies: An array of task IDs that this task depends on. Empty for initial tasks.\n- inputKeys: An array of strings representing keys from the Data Store needed for this task. Use dot notation for nested keys (e.g., "userInput.text").\n- outputKey: A string for the key where the task's result will be stored in the Data Store.\n\nRules for specific task types:\n- GEMINI_PROMPT/IMAGE_ANALYSIS: Must include a 'promptTemplate' field. Use {{key}} for placeholders.\n- TEXT_MANIPULATION: Must include a 'functionBody' field containing a JavaScript function body as a string. E.g., "return \`Report: \${inputs.summary}\`".\n- DATA_INPUT: Must include a 'staticValue' field. Use "{{userInput.text}}", "{{userInput.image}}", or "{{userInput.file}}" to get data from the user input area.\n- DISPLAY_CHART: Must include a 'dataKey' field pointing to data in the Data Store suitable for charting.\n- GEMINI_GROUNDED: For tasks requiring up-to-date information. Should have a 'promptTemplate'.\n\nExample Goal: "Analyze a user-provided text for sentiment and then summarize it."\nExample Output:\n{\n  "name": "Sentiment Analysis and Summary",\n  "description": "A workflow that first determines the sentiment of a text and then provides a concise summary.",\n  "tasks": [\n    { "id": "task-1", "name": "Get User Text", "description": "Receives the text to be analyzed from the user.", "type": "DATA_INPUT", "dependencies": [], "inputKeys": [], "outputKey": "inputText", "staticValue": "{{userInput.text}}" },\n    { "id": "task-2", "name": "Analyze Sentiment", "description": "Determines if the text is positive, negative, or neutral.", "type": "GEMINI_PROMPT", "dependencies": ["task-1"], "inputKeys": ["inputText"], "outputKey": "sentiment", "promptTemplate": "Analyze the sentiment of the following text and return only 'positive', 'negative', or 'neutral':\\n\\n{{inputText}}" },\n    { "id": "task-3", "name": "Summarize Text", "description": "Creates a one-sentence summary of the text.", "type": "GEMINI_PROMPT", "dependencies": ["task-1"], "inputKeys": ["inputText"], "outputKey": "summary", "promptTemplate": "Summarize the following text in a single sentence:\\n\\n{{inputText}}" },\n    { "id": "task-4", "name": "Format Report", "description": "Combines the sentiment and summary into a final report.", "type": "TEXT_MANIPULATION", "dependencies": ["task-2", "task-3"], "inputKeys": ["sentiment", "summary"], "outputKey": "finalReport", "functionBody": "return \`Sentiment: \${inputs.sentiment.toUpperCase()}\nSummary: \${inputs.summary}\`" }\n  ]\n}`;
            try {
                const response = yield ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: "user", parts: [{ text: `User's goal: "${goal}"` }] }],
                    config: {
                        responseMimeType: "application/json",
                        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
                    },
                });
                const text = ((_e = (_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "{}";
                const jsonData = parseJsonFromText(text);
                if (!jsonData.name || !jsonData.description || !Array.isArray(jsonData.tasks)) {
                    throw new Error("Generated workflow is missing required fields (name, description, tasks).");
                }
                jsonData.id = `wf-custom-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                return jsonData;
            }
            catch (error) {
                console.error("Error calling Gemini API for Workflow generation:", error);
                if (error instanceof Error) {
                    throw new Error(`Gemini API Error: ${error.message}`);
                }
                throw new Error("An unknown error occurred while generating the workflow.");
            }
        });
    }
}
exports.default = new GeminiService();
