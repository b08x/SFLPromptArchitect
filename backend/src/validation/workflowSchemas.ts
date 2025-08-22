/**
 * @file workflowSchemas.ts
 * @description Zod schema definitions for comprehensive validation of AI-generated workflows.
 * Provides type-safe validation for Workflow and Task objects with detailed error reporting.
 * 
 * @requires zod
 * @requires ../types
 * @since 2.1.0
 */

import { z } from 'zod';
import { TaskType } from '../types';

/**
 * Schema for AgentConfig object validation
 */
export const AgentConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number()
    .min(0, "temperature must be >= 0")
    .max(2, "temperature must be <= 2")
    .optional(),
  topK: z.number()
    .int("topK must be an integer")
    .min(1, "topK must be >= 1")
    .max(40, "topK must be <= 40")
    .optional(),
  topP: z.number()
    .min(0, "topP must be >= 0")
    .max(1, "topP must be <= 1")
    .optional(),
  systemInstruction: z.string().optional()
});

/**
 * Schema for Task object validation with type-specific requirements
 */
export const TaskSchema = z.object({
  id: z.string()
    .min(1, "Task ID cannot be empty")
    .regex(/^[a-zA-Z0-9_-]+$/, "Task ID must contain only alphanumeric characters, hyphens, and underscores"),
  
  name: z.string()
    .min(1, "Task name cannot be empty")
    .max(100, "Task name must be 100 characters or less"),
  
  description: z.string()
    .min(1, "Task description cannot be empty")
    .max(500, "Task description must be 500 characters or less"),
  
  type: z.nativeEnum(TaskType, {
    message: `Task type must be one of: ${Object.values(TaskType).join(', ')}`
  }),
  
  dependencies: z.array(z.string())
    .default([])
    .refine(
      (deps) => deps.every(dep => typeof dep === 'string' && dep.length > 0),
      { message: "All dependencies must be non-empty strings" }
    ),
  
  inputKeys: z.array(z.string())
    .default([])
    .refine(
      (keys) => keys.every(key => typeof key === 'string' && key.length > 0),
      { message: "All input keys must be non-empty strings" }
    ),
  
  outputKey: z.string()
    .min(1, "Output key cannot be empty")
    .max(50, "Output key must be 50 characters or less"),
  
  // Optional fields that may be present depending on task type
  inputs: z.record(z.string(), z.object({
    nodeId: z.string(),
    outputName: z.string()
  })).optional(),
  
  promptId: z.string().optional(),
  
  promptTemplate: z.string().optional(),
  
  agentConfig: AgentConfigSchema.optional(),
  
  functionBody: z.string().optional(),
  
  staticValue: z.any().optional(),
  
  dataKey: z.string().optional(),
  
  positionX: z.number().optional(),
  
  positionY: z.number().optional()
}).superRefine((task, ctx) => {
  // Type-specific validation rules
  switch (task.type) {
    case TaskType.GEMINI_PROMPT:
    case TaskType.IMAGE_ANALYSIS:
    case TaskType.GEMINI_GROUNDED:
      if (!task.promptTemplate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Task type '${task.type}' requires a 'promptTemplate' field`,
          path: ['promptTemplate']
        });
      }
      break;
    
    case TaskType.TEXT_MANIPULATION:
      if (!task.functionBody) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Task type 'TEXT_MANIPULATION' requires a 'functionBody' field`,
          path: ['functionBody']
        });
      }
      break;
    
    case TaskType.DATA_INPUT:
      if (task.staticValue === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Task type 'DATA_INPUT' requires a 'staticValue' field`,
          path: ['staticValue']
        });
      }
      break;
    
    case TaskType.DISPLAY_CHART:
      if (!task.dataKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Task type 'DISPLAY_CHART' requires a 'dataKey' field`,
          path: ['dataKey']
        });
      }
      break;
  }
});

/**
 * Schema for complete Workflow object validation
 */
export const WorkflowSchema = z.object({
  name: z.string()
    .min(1, "Workflow name cannot be empty")
    .max(200, "Workflow name must be 200 characters or less"),
  
  description: z.string()
    .min(1, "Workflow description cannot be empty")
    .max(1000, "Workflow description must be 1000 characters or less"),
  
  tasks: z.array(TaskSchema)
    .min(1, "Workflow must contain at least one task")
    .max(50, "Workflow cannot exceed 50 tasks")
}).superRefine((workflow, ctx) => {
  // Validate unique task IDs
  const taskIds = workflow.tasks.map(task => task.id);
  const duplicateIds = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
  
  if (duplicateIds.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate task IDs found: ${[...new Set(duplicateIds)].join(', ')}`,
      path: ['tasks']
    });
  }
  
  // Validate that all dependency references exist
  const taskIdSet = new Set(taskIds);
  workflow.tasks.forEach((task, taskIndex) => {
    task.dependencies.forEach((depId, depIndex) => {
      if (!taskIdSet.has(depId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Task '${task.id}' references non-existent dependency '${depId}'`,
          path: ['tasks', taskIndex, 'dependencies', depIndex]
        });
      }
    });
  });
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type ValidatedAgentConfig = z.infer<typeof AgentConfigSchema>;
export type ValidatedTask = z.infer<typeof TaskSchema>;
export type ValidatedWorkflow = z.infer<typeof WorkflowSchema>;

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  data?: ValidatedWorkflow;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
}

/**
 * Validates a workflow object against the comprehensive Zod schema
 * 
 * @param data - The workflow data to validate
 * @returns ValidationResult with success status, validated data, or detailed errors
 */
export function validateWorkflow(data: any): ValidationResult {
  try {
    const result = WorkflowSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      const errors: string[] = [];
      const fieldErrors: Record<string, string[]> = {};
      
      result.error.issues.forEach((error: any) => {
        const path = error.path.join('.');
        const message = error.message;
        
        errors.push(`${path}: ${message}`);
        
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(message);
      });
      
      return {
        success: false,
        errors,
        fieldErrors
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Detects circular dependencies in a validated workflow
 * 
 * @param workflow - The validated workflow to check
 * @returns boolean indicating if circular dependencies exist
 */
export function hasCircularDependencies(workflow: ValidatedWorkflow): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  const taskMap = new Map<string, ValidatedTask>();
  workflow.tasks.forEach(task => taskMap.set(task.id, task));

  const dfsVisit = (taskId: string): boolean => {
    if (recursionStack.has(taskId)) {
      return true; // Circular dependency detected
    }
    
    if (visited.has(taskId)) {
      return false; // Already processed
    }

    visited.add(taskId);
    recursionStack.add(taskId);

    const task = taskMap.get(taskId);
    if (task) {
      for (const depId of task.dependencies) {
        if (dfsVisit(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(taskId);
    return false;
  };

  // Check each task
  for (const task of workflow.tasks) {
    if (!visited.has(task.id)) {
      if (dfsVisit(task.id)) {
        return true;
      }
    }
  }

  return false;
}