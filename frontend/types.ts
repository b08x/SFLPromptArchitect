/**
 * @file types.ts
 * @description This file contains all the TypeScript type definitions and interfaces used throughout the frontend application.
 * It defines the data structures for SFL prompts, workflows, tasks, and other related entities.
 */

/**
 * @interface SFLField
 * @description Defines the structure for the "Field" component of the SFL framework.
 * It represents the "what" of the communication.
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
 * It represents the "who" of the communication.
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
 * It represents the "how" of the communication.
 */
export interface SFLMode {
  outputFormat: string;
  rhetoricalStructure: string;
  lengthConstraint: string;
  textualDirectives: string;
}

/**
 * @interface PromptSFL
 * @description Represents a complete SFL-structured prompt.
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
 * @description Defines the structure for the filter state used to search and filter prompts.
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
 * @description Enumerates the different types of modals used in the application.
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
 * @description Enumerates the different types of tasks that can be part of a workflow.
 */
export enum TaskType {
  DATA_INPUT = "DATA_INPUT",
  GEMINI_PROMPT = "GEMINI_PROMPT",
  IMAGE_ANALYSIS = "IMAGE_ANALYSIS",
  TEXT_MANIPULATION = "TEXT_MANIPULATION",
  SIMULATE_PROCESS = "SIMULATE_PROCESS",
  DISPLAY_CHART = "DISPLAY_CHART",
  GEMINI_GROUNDED = "GEMINI_GROUNDED",
}

/**
 * @enum {string} TaskStatus
 * @description Enumerates the possible execution statuses of a workflow task.
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
 * @description Defines the configuration for an AI agent used in a task.
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
 * @description Represents a single task within a workflow.
 */
export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  dependencies: string[];
  inputKeys: string[];
  outputKey: string;
  promptId?: string;
  promptTemplate?: string;
  agentConfig?: AgentConfig;
  functionBody?: string;
  staticValue?: any;
  dataKey?: string;
}

/**
 * @interface Workflow
 * @description Represents a complete workflow, including its metadata and tasks.
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
 * @description Represents the data store for a workflow run, which is a key-value map.
 */
export type DataStore = Record<string, any>;

/**
 * @interface TaskState
 * @description Defines the execution state of a single task at a point in time.
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
 * @description A map from task IDs to their respective execution states.
 */
export type TaskStateMap = Record<string, TaskState>;

/**
 * @interface StagedUserInput
 * @description Defines the structure for user-provided input that is staged for a workflow run.
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