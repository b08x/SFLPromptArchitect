
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PromptSFL } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will not show in UI in production, but good for local dev if key is missing.
  // The app should ideally handle this more gracefully or assume key is always present.
  console.error("Gemini API Key is missing. Please set the process.env.API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Fallback to prevent crash, though API calls will fail.

const parseJsonFromText = (text: string) => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", text);
    throw new Error("The AI returned a response that was not valid JSON.");
  }
};


export const testPromptWithGemini = async (promptText: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });
    
    return response.text;

  } catch (error: unknown) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};

export const generateSFLFromGoal = async (goal: string): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is not configured.");
    }
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to analyze a user's goal and structure it into a detailed SFL-based prompt.
    The output MUST be a single, valid JSON object. Do not include any text, notes, or explanations outside of the JSON object.
    The JSON object should have the following structure: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string }.
    
    - title: Create a concise, descriptive title based on the user's goal.
    - promptText: Synthesize all the SFL elements into a complete, well-formed prompt that can be sent directly to an AI.
    - sflField (What is happening?): Analyze the subject matter.
    - sflTenor (Who is taking part?): Define the roles and relationships. The "targetAudience" field must be an array of strings, even if only one audience is identified.
    - sflMode (How is it being communicated?): Specify the format and structure of the output.
    - exampleOutput: Provide a brief but illustrative example of the expected output.
    - notes: Add any relevant notes or suggestions for the user.
    - All fields in the JSON must be filled with a string (or array of strings for targetAudience). If no information can be derived for a field, provide an empty string "" or a sensible default.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the user's goal: "${goal}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = response.text;
        const jsonData = parseJsonFromText(text);
        
        // Ensure targetAudience is an array
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
            jsonData.sflTenor.targetAudience = [];
        }


        return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for SFL generation:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the SFL prompt.");
    }
};

export const regenerateSFLFromSuggestion = async (
    currentPrompt: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'geminiResponse' | 'geminiTestError' | 'isTesting'>,
    suggestion: string
): Promise<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>> => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is not configured.");
    }
    
    const systemInstruction = `You are an expert in Systemic Functional Linguistics (SFL) and AI prompt engineering. Your task is to revise an existing SFL prompt based on a user's suggestion.
    The user will provide a JSON object representing the current prompt and a text string with their requested change.
    You MUST return a single, valid JSON object that represents the *revised* prompt. Do not include any text, notes, or explanations outside of the JSON object.
    The output JSON object must have the exact same structure as the input, containing all the original fields, but with values updated according to the suggestion.
    The structure is: { "title": string, "promptText": string, "sflField": { "topic": string, "taskType": string, "domainSpecifics": string, "keywords": string }, "sflTenor": { "aiPersona": string, "targetAudience": string[], "desiredTone": string, "interpersonalStance": string }, "sflMode": { "outputFormat": string, "rhetoricalStructure": string, "lengthConstraint": string, "textualDirectives": string }, "exampleOutput": string, "notes": string }.
    
    - Critically analyze the user's suggestion and apply it to all relevant fields in the prompt.
    - The 'promptText' field is the most important; it must be re-written to reflect the change.
    - Other SFL fields (Field, Tenor, Mode) should be updated logically to align with the new 'promptText' and the user's suggestion.
    - Even update the 'title', 'exampleOutput', and 'notes' if the suggestion implies it.
    - Ensure 'targetAudience' remains an array of strings.
    - All fields must be filled. If no information can be derived for a field, provide an empty string "" or a sensible default, but try to keep existing data if it's still relevant.
    `;

    const userContent = `
    Here is the current prompt JSON:
    ${JSON.stringify(currentPrompt)}

    Here is my suggestion for how to change it:
    "${suggestion}"

    Now, provide the complete, revised JSON object.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const text = response.text;
        const jsonData = parseJsonFromText(text);
        
        // Ensure targetAudience is an array
        if (jsonData.sflTenor && typeof jsonData.sflTenor.targetAudience === 'string') {
            jsonData.sflTenor.targetAudience = [jsonData.sflTenor.targetAudience];
        }
        if (jsonData.sflTenor && !jsonData.sflTenor.targetAudience) {
            jsonData.sflTenor.targetAudience = [];
        }

        return jsonData as Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>;

    } catch (error: unknown) {
        console.error("Error calling Gemini API for SFL regeneration:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while regenerating the SFL prompt.");
    }
};
