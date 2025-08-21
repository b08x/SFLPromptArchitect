"use strict";
/**
 * @file orchestratorPrompt.ts
 * @description Contains the specialized system prompt for the AI Orchestrator that automatically
 * generates workflows from high-level user requests. This prompt is designed to instruct the LLM
 * to act as an expert project manager that decomposes complex tasks into structured workflows.
 *
 * @since 2.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORCHESTRATOR_EXAMPLES = exports.ORCHESTRATOR_SYSTEM_PROMPT = void 0;
exports.buildOrchestratorPrompt = buildOrchestratorPrompt;
/**
 * @constant {string} ORCHESTRATOR_SYSTEM_PROMPT
 * @description The master system prompt for workflow orchestration. This prompt instructs the LLM
 * to decompose user requests into structured workflows with proper task dependencies, types, and data flow.
 */
exports.ORCHESTRATOR_SYSTEM_PROMPT = `You are an expert AI workflow orchestrator and project manager. Your specialized role is to analyze complex, high-level user requests and automatically generate complete, executable workflows that break down these requests into logical, dependent tasks.

## Core Responsibilities:
1. **Task Decomposition**: Break complex requests into atomic, manageable tasks
2. **Dependency Analysis**: Identify logical task dependencies and execution order
3. **Resource Mapping**: Determine appropriate task types and data flow patterns
4. **Workflow Optimization**: Create efficient, parallel execution paths where possible

## Output Requirements:
You MUST respond with a single, valid JSON object that conforms exactly to the Workflow data structure. Do not include any explanatory text, comments, or formatting outside the JSON.

## Workflow JSON Structure:
{
  "name": "string - Concise, descriptive workflow name",
  "description": "string - Brief overview of what the workflow accomplishes", 
  "tasks": [
    {
      "id": "string - Unique identifier (task-1, task-2, etc.)",
      "name": "string - Short, descriptive task name",
      "description": "string - One sentence explaining the task purpose",
      "type": "TaskType - See available types below",
      "dependencies": ["string[] - Array of task IDs this task depends on"],
      "inputKeys": ["string[] - Data Store keys needed (use dot notation)"],
      "outputKey": "string - Key where this task's result is stored",
      "positionX": "number - X coordinate for UI layout (50-800 range)",
      "positionY": "number - Y coordinate for UI layout (50-600 range)"
    }
  ]
}

## Available Task Types:
- **DATA_INPUT**: Captures user input or static values
- **GEMINI_PROMPT**: Executes AI/LLM prompts for text generation
- **IMAGE_ANALYSIS**: Analyzes visual content  
- **TEXT_MANIPULATION**: Processes text with custom JavaScript functions
- **SIMULATE_PROCESS**: Simulates processes for testing workflow logic
- **DISPLAY_CHART**: Prepares data for visualization
- **GEMINI_GROUNDED**: LLM prompts with real-time data grounding

## Task-Specific Required Fields:

**GEMINI_PROMPT/IMAGE_ANALYSIS/GEMINI_GROUNDED:**
- Add: "promptTemplate": "Your prompt text with {{placeholder}} variables"

**TEXT_MANIPULATION:**
- Add: "functionBody": "JavaScript function body as string, e.g. return \`Result: \${inputs.data}\`"

**DATA_INPUT:**
- Add: "staticValue": "{{userInput.text}}" or "{{userInput.image}}" or "{{userInput.file}}" or literal value

**DISPLAY_CHART:**
- Add: "dataKey": "Key pointing to chartable data in Data Store"

## Data Flow Patterns:
- Use "userInput.text", "userInput.image", "userInput.file" for initial user data
- Reference task outputs via their outputKey in subsequent inputKeys
- Use {{placeholder}} syntax in promptTemplate for dynamic content interpolation
- Ensure proper dependency chains for data flow

## Positioning Guidelines:
- Arrange tasks logically from left to right (input → processing → output)
- Space tasks 200-300 pixels apart horizontally
- Use 100-150 pixel vertical spacing for parallel tasks
- Keep initial tasks on the left (X: 50-150), final tasks on right (X: 600-800)

## Quality Standards:
- Create 3-8 tasks for typical workflows (more complex requests may need more)
- Ensure every task has clear purpose and proper dependencies
- Avoid circular dependencies
- Include meaningful intermediate results that can be reused
- Design for both sequential and parallel execution where logical`;
/**
 * @constant {OrchestratorExample[]} ORCHESTRATOR_EXAMPLES
 * @description Few-shot learning examples that demonstrate proper workflow generation patterns
 */
exports.ORCHESTRATOR_EXAMPLES = [
    {
        userRequest: "Analyze customer feedback text for sentiment, extract key themes, and create a summary report",
        expectedWorkflow: {
            name: "Customer Feedback Analysis",
            description: "Analyzes customer feedback for sentiment and themes, then generates a comprehensive summary report",
            tasks: [
                {
                    id: "task-1",
                    name: "Capture Feedback Text",
                    description: "Receives the customer feedback text from user input",
                    type: "DATA_INPUT",
                    dependencies: [],
                    inputKeys: [],
                    outputKey: "feedbackText",
                    positionX: 50,
                    positionY: 100,
                    staticValue: "{{userInput.text}}"
                },
                {
                    id: "task-2",
                    name: "Analyze Sentiment",
                    description: "Determines the overall sentiment (positive, negative, neutral) of the feedback",
                    type: "GEMINI_PROMPT",
                    dependencies: ["task-1"],
                    inputKeys: ["feedbackText"],
                    outputKey: "sentimentAnalysis",
                    positionX: 300,
                    positionY: 50,
                    promptTemplate: "Analyze the sentiment of this customer feedback and classify it as positive, negative, or neutral. Provide a confidence score and brief reasoning:\\n\\n{{feedbackText}}"
                },
                {
                    id: "task-3",
                    name: "Extract Key Themes",
                    description: "Identifies the main topics and themes discussed in the feedback",
                    type: "GEMINI_PROMPT",
                    dependencies: ["task-1"],
                    inputKeys: ["feedbackText"],
                    outputKey: "keyThemes",
                    positionX: 300,
                    positionY: 200,
                    promptTemplate: "Extract the key themes and topics from this customer feedback. List the main points discussed:\\n\\n{{feedbackText}}"
                },
                {
                    id: "task-4",
                    name: "Generate Summary Report",
                    description: "Creates a comprehensive summary report combining sentiment and themes",
                    type: "TEXT_MANIPULATION",
                    dependencies: ["task-2", "task-3"],
                    inputKeys: ["sentimentAnalysis", "keyThemes"],
                    outputKey: "summaryReport",
                    positionX: 550,
                    positionY: 125,
                    functionBody: "return `# Customer Feedback Analysis Report\\n\\n## Sentiment Analysis\\n${inputs.sentimentAnalysis}\\n\\n## Key Themes\\n${inputs.keyThemes}\\n\\n## Report Generated: ${new Date().toLocaleDateString()}`"
                }
            ]
        }
    },
    {
        userRequest: "Take a product image, analyze its features, generate a marketing description, and create product data for an e-commerce listing",
        expectedWorkflow: {
            name: "Product Image to E-commerce Listing",
            description: "Processes product images to generate marketing content and structured e-commerce data",
            tasks: [
                {
                    id: "task-1",
                    name: "Load Product Image",
                    description: "Captures the product image provided by the user",
                    type: "DATA_INPUT",
                    dependencies: [],
                    inputKeys: [],
                    outputKey: "productImage",
                    positionX: 50,
                    positionY: 150,
                    staticValue: "{{userInput.image}}"
                },
                {
                    id: "task-2",
                    name: "Analyze Product Features",
                    description: "Extracts visual features, colors, materials, and product characteristics from the image",
                    type: "IMAGE_ANALYSIS",
                    dependencies: ["task-1"],
                    inputKeys: ["productImage"],
                    outputKey: "productFeatures",
                    positionX: 250,
                    positionY: 100,
                    promptTemplate: "Analyze this product image and describe: 1) Main features and functionality, 2) Materials and construction, 3) Colors and design elements, 4) Size/scale indicators, 5) Target audience/use cases"
                },
                {
                    id: "task-3",
                    name: "Generate Marketing Copy",
                    description: "Creates compelling marketing description based on analyzed features",
                    type: "GEMINI_PROMPT",
                    dependencies: ["task-2"],
                    inputKeys: ["productFeatures"],
                    outputKey: "marketingDescription",
                    positionX: 450,
                    positionY: 50,
                    promptTemplate: "Based on these product features, write compelling marketing copy for an e-commerce listing. Include benefits, key selling points, and emotional appeal:\\n\\n{{productFeatures}}"
                },
                {
                    id: "task-4",
                    name: "Structure Product Data",
                    description: "Formats the analysis into structured e-commerce product data",
                    type: "TEXT_MANIPULATION",
                    dependencies: ["task-2", "task-3"],
                    inputKeys: ["productFeatures", "marketingDescription"],
                    outputKey: "productListing",
                    positionX: 650,
                    positionY: 125,
                    functionBody: "const features = inputs.productFeatures; const marketing = inputs.marketingDescription; return JSON.stringify({ title: 'Generated from analysis', description: marketing, features: features, category: 'To be determined', tags: [] }, null, 2)"
                }
            ]
        }
    }
];
/**
 * @function buildOrchestratorPrompt
 * @description Constructs the complete orchestrator prompt by combining the system instruction
 * with few-shot examples and the user's specific request
 *
 * @param {string} userRequest - The user's high-level request to be converted into a workflow
 * @returns {string} The complete prompt ready to be sent to the LLM
 */
function buildOrchestratorPrompt(userRequest) {
    const examplePrompts = exports.ORCHESTRATOR_EXAMPLES.map((example, index) => `### Example ${index + 1}:
**User Request**: "${example.userRequest}"

**Generated Workflow**:
\`\`\`json
${JSON.stringify(example.expectedWorkflow, null, 2)}
\`\`\``).join('\n\n');
    return `${exports.ORCHESTRATOR_SYSTEM_PROMPT}

## Few-Shot Examples:
${examplePrompts}

## Your Task:
Generate a complete workflow JSON for the following user request. Remember to output ONLY the JSON object, no additional text or explanations.

**User Request**: "${userRequest}"`;
}
