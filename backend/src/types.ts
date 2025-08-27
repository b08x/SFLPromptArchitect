/**
 * @file types.ts
 * @description This file contains TypeScript type definitions and interfaces for the backend.
 * It defines the data structures for database entities like Prompts and Workflows,
 * as well as the detailed SFL-structured prompt types that align with the frontend.
 */

/**
 * @interface Prompt
 * @description Represents the structure of a prompt record in the database.
 */
export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * @interface SFLField
 * @description Defines the structure for the "Field" component of the SFL framework.
 * Aligns with the frontend `SFLField` type.
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
 * Aligns with the frontend `SFLTenor` type.
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
 * Aligns with the frontend `SFLMode` type.
 */
export interface SFLMode {
  outputFormat: string;
  rhetoricalStructure: string;
  lengthConstraint: string;
  textualDirectives: string;
}

/**
 * @interface PromptSFL
 * @description Represents a complete SFL-structured prompt, aligning with the frontend `PromptSFL` type.
 * This is the primary data structure for prompts used in the API.
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
 * @interface Workflow
 * @description Represents the structure of a workflow record in the database.
 */
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  graph_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  tasks?: Task[]; // Tasks are part of the graph_data but can be represented here
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
 * @interface AgentConfig
 * @description Defines the configuration for an AI agent used in a task.
 */
export interface AgentConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
  systemInstruction?: string;
  baseUrl?: string;
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
 * @type DataStore
 * @description Represents the data store for a workflow run, which is a key-value map.
 */
export type DataStore = Record<string, any>;

/**
 * @interface WorkflowExecution
 * @description Represents a workflow execution record in the database.
 */
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  job_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, any>;
  user_input?: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
