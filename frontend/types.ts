/**
 * @file types.ts
 * @description This file contains all the TypeScript type definitions and interfaces used throughout the frontend application.
 * It defines the data structures for SFL prompts, workflows, tasks, and other related entities, serving as a single source of truth for the application's data model.
 */

/**
 * @interface SFLField
 * @description Defines the structure for the "Field" component of the Systemic Functional Linguistics (SFL) framework.
 * It represents the "what" of the communication: the subject matter, domain, and the action being performed.
 * @property {string} topic - The high-level subject area (e.g., "Quantum Physics").
 * @property {string} taskType - The specific action the AI should perform (e.g., "Summarization").
 * @property {string} domainSpecifics - Fine-grained contextual details or constraints (e.g., "Python 3.9, pandas").
 * @property {string} keywords - Comma-separated terms that are central to the response.
 */
export interface SFLField {
  topic: string;
  taskType: string;
  domainSpecifics: string;
  keywords: string;
}

/**
 * @interface SFLTenor
 * @description Defines the structure for the "Tenor" component of the SFL framework.
 * It represents the "who" of the communication: the social roles and relationships.
 * @property {string} aiPersona - The character or role the AI should adopt (e.g., "Expert", "Sarcastic Bot").
 * @property {string[]} targetAudience - The intended recipients of the AI's response (e.g., ["Beginners", "Software Developers"]).
 * @property {string} desiredTone - The emotional and stylistic attitude of the response (e.g., "Formal", "Humorous").
 * @property {string} interpersonalStance - The social relationship between the AI and the user (e.g., "Act as a mentor").
 */
export interface SFLTenor {
  aiPersona: string;
  targetAudience: string[];
  desiredTone: string;
  interpersonalStance: string;
}

/**
 * @interface SFLMode
 * @description Defines the structure for the "Mode" component of the SFL framework.
 * It represents the "how" of the communication: the structure and format of the text.
 * @property {string} outputFormat - The required syntactical structure of the output (e.g., "JSON", "Markdown").
 * @property {string} rhetoricalStructure - The high-level organizational pattern (e.g., "Problem-Solution").
 * @property {string} lengthConstraint - The desired length of the response (e.g., "Short Paragraph (~50 words)").
 * @property {string} textualDirectives - Specific, micro-level rules about style or grammar (e.g., "Use active voice").
 */
export interface SFLMode {
  outputFormat: string;
  rhetoricalStructure: string;
  lengthConstraint: string;
  textualDirectives: string;
}

/**
 * @interface PromptSFL
 * @description Represents a complete SFL-structured prompt, combining the core prompt text with rich metadata
 * from the SFL framework and application-specific state.
 * @property {string} id - A unique identifier for the prompt.
 * @property {string} title - A user-defined title for the prompt.
 * @property {string} promptText - The main, executable text of the prompt, which may include `{{variables}}`.
 * @property {SFLField} sflField - The "Field" metadata for the prompt.
 * @property {SFLTenor} sflTenor - The "Tenor" metadata for the prompt.
 * @property {SFLMode} sflMode - The "Mode" metadata for the prompt.
 * @property {string} [exampleOutput] - An optional example of a desired output.
 * @property {string} [notes] - Optional user notes about the prompt.
 * @property {string} createdAt - ISO 8601 timestamp of when the prompt was created.
 * @property {string} updatedAt - ISO 8601 timestamp of the last update.
 * @property {string} [geminiResponse] - The last successful response from testing the prompt with Gemini.
 * @property {string} [geminiTestError] - The last error message from a failed Gemini test.
 * @property {boolean} [isTesting] - A transient flag indicating if the prompt is currently being tested.
 * @property {{name: string; content: string}} [sourceDocument] - An optional attached document for stylistic reference.
 */
export interface PromptSFL {
  id: string;
  title: string;
  promptText: string;
  sflField: SFLField;
  sflTenor: SFLTenor;
  sflMode: SFLMode;
  exampleOutput?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  geminiResponse?: string;
  geminiTestError?: string;
  isTesting?: boolean;
  sourceDocument?: {
    name: string;
    content: string;
  };
}

/**
 * @interface Filters
 * @description Defines the structure for the filter state used to search and filter the list of prompts.
 * Each property corresponds to a filter control in the UI.
 */
export interface Filters {
  searchTerm: string;
  topic: string;
  taskType: string;
  aiPersona: string;
  outputFormat: string;
}

/**
 * @enum {number} ModalType
 * @description Enumerates the different types of modals used across the application to manage which modal is active.
 */
export enum ModalType {
  NONE,
  CREATE_EDIT_PROMPT,
  VIEW_PROMPT_DETAIL,
  WIZARD,
  HELP,
  WORKFLOW_EDITOR,
  WORKFLOW_WIZARD,
  TASK_DETAIL,
}

/**
 * @enum {string} TaskType
 * @description Enumerates the different types of tasks that can be included in a workflow.
 */
export enum TaskType {
  /** A task that takes static data or user input and places it in the data store. */
  DATA_INPUT = "DATA_INPUT",
  /** A task that executes a prompt using the Gemini API. */
  GEMINI_PROMPT = "GEMINI_PROMPT",
  /** A task for analyzing image data. */
  IMAGE_ANALYSIS = "IMAGE_ANALYSIS",
  /** A task that runs a custom JavaScript snippet to manipulate data. */
  TEXT_MANIPULATION = "TEXT_MANIPULATION",
  /** A task that simulates a process, useful for testing workflow structures. */
  SIMULATE_PROCESS = "SIMULATE_PROCESS",
  /** A task that prepares data for visualization as a chart. */
  DISPLAY_CHART = "DISPLAY_CHART",
  /** A task that executes a Gemini prompt with grounding on a specific data source. */
  GEMINI_GROUNDED = "GEMINI_GROUNDED",
}

/**
 * @enum {string} TaskStatus
 * @description Enumerates the possible execution statuses of a workflow task during a run.
 */
export enum TaskStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
}

/**
 * @interface AgentConfig
 * @description Defines the configuration for an AI agent (e.g., Gemini model) used in a task.
 * @property {string} [model] - The specific model to use (e.g., 'gemini-1.5-flash').
 * @property {number} [temperature] - Controls the randomness of the output.
 * @property {number} [topK] - The top-K sampling parameter.
 * @property {number} [topP] - The top-P (nucleus) sampling parameter.
 * @property {string} [systemInstruction] - A system-level instruction for the model.
 */
export interface AgentConfig {
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  systemInstruction?: string;
}

/**
 * @interface Task
 * @description Represents a single, configurable step within a workflow.
 * @property {string} id - A unique identifier for the task.
 * @property {string} name - A user-defined name for the task.
 * @property {string} description - A brief description of what the task does.
 * @property {TaskType} type - The type of the task, which determines its execution logic.
 * @property {string[]} dependencies - An array of task IDs that must be completed before this task can run.
 * @property {string[]} inputKeys - An array of keys (using dot-notation) to retrieve values from the `DataStore`.
 * @property {string} outputKey - The key under which this task's result will be saved in the `DataStore`.
 * @property {Record<string, { nodeId: string; outputName: string; }>} [inputs] - Input mappings defining data dependencies between tasks.
 * @property {string} [promptId] - The ID of an SFL prompt from the library to be used by this task.
 * @property {string} [promptTemplate] - A manual prompt template, used if `promptId` is not set.
 * @property {AgentConfig} [agentConfig] - Configuration for the AI model, if applicable.
 * @property {string} [functionBody] - The JavaScript code for a `TEXT_MANIPULATION` task.
 * @property {*} [staticValue] - A static value for a `DATA_INPUT` task.
 * @property {string} [dataKey] - The key in the `DataStore` to use for a `DISPLAY_CHART` task.
 * @property {number} [positionX] - X coordinate for UI positioning in the workflow canvas.
 * @property {number} [positionY] - Y coordinate for UI positioning in the workflow canvas.
 */
export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  dependencies: string[];
  inputKeys: string[];
  outputKey: string;
  inputs?: Record<string, { nodeId: string; outputName: string; }>;
  promptId?: string;
  promptTemplate?: string;
  agentConfig?: AgentConfig;
  functionBody?: string;
  staticValue?: any;
  dataKey?: string;
  positionX?: number;
  positionY?: number;
}

/**
 * @interface Workflow
 * @description Represents a complete workflow, composed of metadata and a series of interconnected tasks.
 * @property {string} id - A unique identifier for the workflow.
 * @property {string} name - A user-defined name for the workflow.
 * @property {string} description - A brief description of the workflow's purpose.
 * @property {Task[]} tasks - An array of the tasks that make up the workflow.
 * @property {boolean} [isDefault] - A flag indicating if this is a read-only, default workflow.
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  isDefault?: boolean;
}

/**
 * @type DataStore
 * @description Represents the data store for a workflow run. It's a key-value map where keys are
 * task `outputKey`s and values are the results of those tasks.
 */
export type DataStore = Record<string, any>;

/**
 * @interface TaskState
 * @description Defines the execution state of a single task at a specific moment during a workflow run.
 * @property {TaskStatus} status - The current execution status of the task.
 * @property {*} [result] - The output of the task upon successful completion.
 * @property {string} [error] - The error message if the task failed.
 * @property {number} [startTime] - The timestamp (in milliseconds) when the task started execution.
 * @property {number} [endTime] - The timestamp (in milliseconds) when the task finished execution.
 */
export interface TaskState {
  status: TaskStatus;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * @type TaskStateMap
 * @description A map from task IDs to their respective `TaskState`, representing the state of the entire workflow.
 */
export type TaskStateMap = Record<string, TaskState>;

/**
 * @interface StagedUserInput
 * @description Defines the structure for user-provided input that is staged for a workflow run.
 * This data is placed into the `DataStore` under the `userInput` key at the start of a run.
 * @property {string} [text] - Staged text input.
 * @property {{name: string; type: string; base64: string;}} [image] - Staged image input, including metadata and base64 content.
 * @property {{name: string; content: string;}} [file] - Staged text file input.
 */
export interface StagedUserInput {
    text?: string;
    image?: {
        name: string;
        type: string;
        base64: string;
    };
    file?: {
        name: string;
        content: string;
    }
}

/**
 * @interface WorkflowExecution
 * @description Represents a workflow execution record, tracking the status and results of asynchronous workflow runs.
 * @property {string} id - Unique identifier for the execution.
 * @property {string} workflowId - ID of the workflow being executed.
 * @property {string} [jobId] - BullMQ job ID for tracking the background execution.
 * @property {'pending' | 'running' | 'completed' | 'failed'} status - Current execution status.
 * @property {Record<string, any>} [result] - Final execution results when completed.
 * @property {Record<string, any>} [userInput] - Initial user input provided for the execution.
 * @property {string} [errorMessage] - Error details if the execution failed.
 * @property {string} [startedAt] - ISO timestamp when execution started.
 * @property {string} [completedAt] - ISO timestamp when execution completed or failed.
 * @property {string} createdAt - ISO timestamp when the execution record was created.
 * @property {string} updatedAt - ISO timestamp when the execution record was last updated.
 */
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    jobId?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: Record<string, any>;
    userInput?: Record<string, any>;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}
