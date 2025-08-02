/**
 * @file constants.ts
 * @description This file exports constant values used throughout the frontend application.
 * This includes predefined lists for SFL parameters, initial state objects for prompts and workflows,
 * and other shared constants to ensure consistency and avoid magic strings.
 */

import { SFLField, SFLTenor, SFLMode, PromptSFL, Workflow, TaskType } from './types';

/**
 * @constant {string[]} TASK_TYPES
 * @description A predefined list of common task types that can be assigned to an SFL prompt's 'Field'.
 * Used to populate dropdowns in the UI.
 */
export const TASK_TYPES = [
  "Explanation", "Summarization", "Code Generation", "Creative Writing", 
  "Translation", "Brainstorming", "Question Answering", "Data Analysis", 
  "Comparison", "Instruction", "Dialogue Generation", "Outline Creation"
];

/**
 * @constant {string[]} AI_PERSONAS
 * @description A predefined list of AI personas that can be assigned to an SFL prompt's 'Tenor'.
 * Used to populate dropdowns in the UI.
 */
export const AI_PERSONAS = [
  "Expert", "Friendly Assistant", "Sarcastic Bot", "Neutral Reporter", 
  "Creative Muse", "Teacher/Tutor", "Devil's Advocate", "Philosopher", "Historian"
];

/**
 * @constant {string[]} TARGET_AUDIENCES
 * @description A predefined list of target audiences for an SFL prompt's 'Tenor'.
 * Used to populate selection options in the UI.
 */
export const TARGET_AUDIENCES = [
  "General Public", "Beginners", "Intermediates", "Experts", "Children (5-7 years)", 
  "Teenagers (13-17 years)", "Software Developers", "Academic Researchers", 
  "Business Professionals", "Policy Makers"
];

/**
 * @constant {string[]} DESIRED_TONES
 * @description A predefined list of desired tones for an SFL prompt's 'Tenor'.
 * Used to populate dropdowns in the UI.
 */
export const DESIRED_TONES = [
  "Formal", "Informal", "Humorous", "Serious", "Empathetic", "Concise", 
  "Detailed", "Persuasive", "Objective", "Enthusiastic", "Critical", "Neutral"
];

/**
 * @constant {string[]} OUTPUT_FORMATS
 * @description A predefined list of output formats for an SFL prompt's 'Mode'.
 * Used to populate dropdowns in the UI.
 */
export const OUTPUT_FORMATS = [
  "Plain Text", "Markdown", "JSON", "XML", "Python Code", "JavaScript Code", 
  "HTML", "Bullet Points", "Numbered List", "Poem", "Short Story", "Email", 
  "Report", "Spreadsheet (CSV-like)", "Slide Presentation Outline"
];

/**
 * @constant {string[]} LENGTH_CONSTRAINTS
 * @description A predefined list of length constraints for an SFL prompt's 'Mode'.
 * Used to populate dropdowns in the UI.
 */
export const LENGTH_CONSTRAINTS = [
  "Single Sentence", "Short Paragraph (~50 words)", "Medium Paragraph (~150 words)", 
  "Long Paragraph (~300 words)", "Multiple Paragraphs (~500+ words)", 
  "Concise (as needed)", "Detailed (as needed)", "No Specific Limit"
];

/**
 * @constant {string[]} POPULAR_TAGS
 * @description A list of popular tags displayed in the sidebar for quick filtering of prompts.
 */
export const POPULAR_TAGS = ["#summarization", "#expert-persona", "#python-code", "#formal-tone", "#technical", "#json"];

/**
 * @constant {SFLField} SFL_EMPTY_FIELD
 * @description Provides a default, empty object for the 'Field' part of an SFL prompt.
 * Ensures that new prompts have a consistent starting structure.
 */
export const SFL_EMPTY_FIELD: SFLField = {
  topic: "", taskType: TASK_TYPES[0] || "", domainSpecifics: "", keywords: ""
};

/**
 * @constant {SFLTenor} SFL_EMPTY_TENOR
 * @description Provides a default, empty object for the 'Tenor' part of an SFL prompt.
 */
export const SFL_EMPTY_TENOR: SFLTenor = {
  aiPersona: AI_PERSONAS[0] || "", targetAudience: [], 
  desiredTone: DESIRED_TONES[0] || "", interpersonalStance: ""
};

/**
 * @constant {SFLMode} SFL_EMPTY_MODE
 * @description Provides a default, empty object for the 'Mode' part of an SFL prompt.
 */
export const SFL_EMPTY_MODE: SFLMode = {
  outputFormat: OUTPUT_FORMATS[0] || "", rhetoricalStructure: "", 
  lengthConstraint: LENGTH_CONSTRAINTS[0] || "", textualDirectives: ""
};

/**
 * @constant {Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'>} INITIAL_PROMPT_SFL
 * @description The default state for a new, unsaved SFL prompt. Used to initialize the prompt creation form.
 */
export const INITIAL_PROMPT_SFL: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt'> = {
  title: "",
  promptText: "",
  sflField: { ...SFL_EMPTY_FIELD },
  sflTenor: { ...SFL_EMPTY_TENOR },
  sflMode: { ...SFL_EMPTY_MODE },
  exampleOutput: "",
  notes: "",
  sourceDocument: undefined,
};

/**
 * @constant {Workflow[]} DEFAULT_WORKFLOWS
 * @description A list of pre-built, read-only workflows that are available to all users.
 * These serve as examples and starting points for creating custom workflows.
 */
export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "wf-default-1",
    name: "Analyze and Summarize Article",
    description: "Takes an article from user input, analyzes its sentiment, and provides a concise summary.",
    isDefault: true,
    tasks: [
      {
        id: "task-1",
        name: "User Input Article",
        description: "Accepts the article text from the user.",
        type: TaskType.DATA_INPUT,
        dependencies: [],
        inputKeys: ['userInput.text'],
        outputKey: 'articleText',
        staticValue: "{{userInput.text}}",
      },
      {
        id: "task-2",
        name: "Sentiment Analysis",
        description: "Analyzes the sentiment of the article.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["task-1"],
        inputKeys: ["articleText"],
        outputKey: "sentiment",
        promptTemplate: "Analyze the sentiment of the following article and classify it as POSITIVE, NEGATIVE, or NEUTRAL. Return only the classification. Article: {{articleText}}",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.1 }
      },
      {
        id: "task-3",
        name: "Generate Summary",
        description: "Creates a 3-sentence summary of the article.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["task-1"],
        inputKeys: ["articleText"],
        outputKey: "summary",
        promptTemplate: "Summarize the following article in three concise sentences. Article: {{articleText}}",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.7 }
      },
      {
        id: "task-4",
        name: "Format Final Report",
        description: "Combines the summary and sentiment into a final report.",
        type: TaskType.TEXT_MANIPULATION,
        dependencies: ["task-2", "task-3"],
        inputKeys: ["summary", "sentiment"],
        outputKey: "finalReport",
        functionBody: "return `Sentiment: ${inputs.sentiment}\n\nSummary:\n${inputs.summary}`"
      }
    ]
  },
  {
    id: "wf-default-2",
    name: "Image Content Description",
    description: "Accepts an image, describes its contents, and suggests social media captions.",
    isDefault: true,
    tasks: [
      {
        id: "img-task-1",
        name: "User Input Image",
        description: "Accepts an image from the user.",
        type: TaskType.DATA_INPUT,
        dependencies: [],
        inputKeys: ['userInput.image'],
        outputKey: 'userImage',
        staticValue: "{{userInput.image}}",
      },
      {
        id: "img-task-2",
        name: "Describe Image Content",
        description: "Generates a detailed description of the uploaded image.",
        type: TaskType.IMAGE_ANALYSIS,
        dependencies: ["img-task-1"],
        inputKeys: ["userImage"],
        outputKey: "imageDescription",
        promptTemplate: "Describe the contents of this image in detail.",
        agentConfig: { model: 'gemini-2.5-flash' }
      },
      {
        id: "img-task-3",
        name: "Suggest Social Media Captions",
        description: "Generates 3 social media captions based on the image description.",
        type: TaskType.GEMINI_PROMPT,
        dependencies: ["img-task-2"],
        inputKeys: ["imageDescription"],
        outputKey: "captions",
        promptTemplate: "Based on the following description of an image, generate 3 creative and engaging social media captions. Image description: {{imageDescription}}",
        agentConfig: { model: 'gemini-2.5-flash', temperature: 0.8 }
      }
    ]
  }
];