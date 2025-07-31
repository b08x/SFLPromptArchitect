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
}