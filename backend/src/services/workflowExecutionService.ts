import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Task, DataStore, AgentConfig, PromptSFL } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

const getNested = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const templateString = (template: string, dataStore: DataStore): any => {
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

const executeGeminiPrompt = async (prompt: string, agentConfig?: AgentConfig): Promise<string> => {
    const model = agentConfig?.model || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: agentConfig?.temperature,
            topK: agentConfig?.topK,
            topP: agentConfig?.topP,
            systemInstruction: agentConfig?.systemInstruction ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const executeImageAnalysis = async (prompt: string, imagePart: Part, agentConfig?: AgentConfig): Promise<string> => {
    const model = agentConfig?.model || 'gemini-2.5-flash';
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [textPart, imagePart] }],
        config: {
            temperature: agentConfig?.temperature,
            systemInstruction: agentConfig?.systemInstruction ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
        },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const executeGroundedGeneration = async (prompt: string, agentConfig?: AgentConfig): Promise<{ text: string, sources: any[] }> => {
    const model = agentConfig?.model || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: agentConfig?.systemInstruction ? { role: "system", parts: [{ text: agentConfig.systemInstruction }] } : undefined,
            temperature: agentConfig?.temperature,
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri);

    return {
        text: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
        sources: sources,
    };
};

const executeTextManipulation = (funcBody: string, inputs: Record<string, any>): any => {
    try {
        const func = new Function('inputs', funcBody);
        return func(inputs);
    } catch (e: any) {
        throw new Error(`Error in custom function: ${e.message}`);
    }
};

class WorkflowExecutionService {
    async executeTask(task: Task, dataStore: DataStore, prompt?: PromptSFL): Promise<any> {
        const inputs: Record<string, any> = {};
        for (const key of task.inputKeys) {
            inputs[key] = getNested(dataStore, key);
            if (inputs[key] === undefined) {
                 throw new Error(`Missing required input key "${key}" in data store for task "${task.name}".`);
            }
        }
        
        const resolvedInputs = task.inputKeys.reduce((acc: Record<string, any>, key: string) => {
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
                    if (sflTenor.aiPersona) instructionParts.push(`You will act as a ${sflTenor.aiPersona}.`);
                    if (sflTenor.desiredTone) instructionParts.push(`Your tone should be ${sflTenor.desiredTone}.`);
                    if (sflTenor.targetAudience?.length) instructionParts.push(`You are writing for ${sflTenor.targetAudience.join(', ')}.`);
                    if (sflMode.textualDirectives) instructionParts.push(`Follow these directives: ${sflMode.textualDirectives}.`);
                    
                    const systemInstruction = instructionParts.join(' ');
                    
                    const finalPromptText = templateString(linkedPrompt.promptText, dataStore);
                    const finalAgentConfig = { ...task.agentConfig, systemInstruction };
                    
                    return executeGeminiPrompt(finalPromptText, finalAgentConfig);

                } else {
                     if (!task.promptTemplate) throw new Error("Prompt template is missing for non-linked prompt task.");
                    const finalPrompt = templateString(task.promptTemplate, dataStore);
                    return executeGeminiPrompt(finalPrompt, task.agentConfig);
                }
            }
            
            case 'GEMINI_GROUNDED':
                if (!task.promptTemplate) throw new Error("Prompt template is missing.");
                const groundedPrompt = templateString(task.promptTemplate, dataStore);
                return executeGroundedGeneration(groundedPrompt, task.agentConfig);

            case 'IMAGE_ANALYSIS': {
                if (!task.promptTemplate) throw new Error("Prompt template is missing.");

                const imageInputKey = task.inputKeys[0];
                if (!imageInputKey) {
                    throw new Error("IMAGE_ANALYSIS task must have at least one input key pointing to the image data.");
                }
                
                const imageData = inputs[imageInputKey];
                if (!imageData || typeof imageData.base64 !== 'string' || typeof imageData.type !== 'string') {
                    throw new Error(`Image data from key "${imageInputKey}" is missing, malformed, or not found in inputs.`);
                }

                const imagePart: Part = {
                    inlineData: {
                        data: imageData.base64,
                        mimeType: imageData.type,
                    },
                };

                const analysisPrompt = templateString(task.promptTemplate, dataStore);
                return executeImageAnalysis(analysisPrompt, imagePart, task.agentConfig);
            }

            case 'TEXT_MANIPULATION':
                if (!task.functionBody) throw new Error("Function body is missing.");
                return executeTextManipulation(task.functionBody, resolvedInputs);

            default:
                throw new Error(`Unsupported task type: ${task.type}`);
        }
    }
}

export default new WorkflowExecutionService();