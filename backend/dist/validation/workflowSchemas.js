"use strict";
/**
 * @file workflowSchemas.ts
 * @description Zod schema definitions for comprehensive validation of AI-generated workflows.
 * Provides type-safe validation for Workflow and Task objects with detailed error reporting.
 *
 * @requires zod
 * @requires ../types
 * @since 2.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowSchema = exports.TaskSchema = exports.AgentConfigSchema = void 0;
exports.validateWorkflow = validateWorkflow;
exports.hasCircularDependencies = hasCircularDependencies;
const zod_1 = require("zod");
const types_1 = require("../types");
/**
 * Schema for AgentConfig object validation
 */
exports.AgentConfigSchema = zod_1.z.object({
    model: zod_1.z.string().optional(),
    temperature: zod_1.z.number()
        .min(0, "temperature must be >= 0")
        .max(2, "temperature must be <= 2")
        .optional(),
    topK: zod_1.z.number()
        .int("topK must be an integer")
        .min(1, "topK must be >= 1")
        .max(40, "topK must be <= 40")
        .optional(),
    topP: zod_1.z.number()
        .min(0, "topP must be >= 0")
        .max(1, "topP must be <= 1")
        .optional(),
    systemInstruction: zod_1.z.string().optional()
});
/**
 * Schema for Task object validation with type-specific requirements
 */
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string()
        .min(1, "Task ID cannot be empty")
        .regex(/^[a-zA-Z0-9_-]+$/, "Task ID must contain only alphanumeric characters, hyphens, and underscores"),
    name: zod_1.z.string()
        .min(1, "Task name cannot be empty")
        .max(100, "Task name must be 100 characters or less"),
    description: zod_1.z.string()
        .min(1, "Task description cannot be empty")
        .max(500, "Task description must be 500 characters or less"),
    type: zod_1.z.nativeEnum(types_1.TaskType, {
        message: `Task type must be one of: ${Object.values(types_1.TaskType).join(', ')}`
    }),
    dependencies: zod_1.z.array(zod_1.z.string())
        .default([])
        .refine((deps) => deps.every(dep => typeof dep === 'string' && dep.length > 0), { message: "All dependencies must be non-empty strings" }),
    inputKeys: zod_1.z.array(zod_1.z.string())
        .default([])
        .refine((keys) => keys.every(key => typeof key === 'string' && key.length > 0), { message: "All input keys must be non-empty strings" }),
    outputKey: zod_1.z.string()
        .min(1, "Output key cannot be empty")
        .max(50, "Output key must be 50 characters or less"),
    // Optional fields that may be present depending on task type
    inputs: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        nodeId: zod_1.z.string(),
        outputName: zod_1.z.string()
    })).optional(),
    promptId: zod_1.z.string().optional(),
    promptTemplate: zod_1.z.string().optional(),
    agentConfig: exports.AgentConfigSchema.optional(),
    functionBody: zod_1.z.string().optional(),
    staticValue: zod_1.z.any().optional(),
    dataKey: zod_1.z.string().optional(),
    positionX: zod_1.z.number().optional(),
    positionY: zod_1.z.number().optional()
}).superRefine((task, ctx) => {
    // Type-specific validation rules
    switch (task.type) {
        case types_1.TaskType.GEMINI_PROMPT:
        case types_1.TaskType.IMAGE_ANALYSIS:
        case types_1.TaskType.GEMINI_GROUNDED:
            if (!task.promptTemplate) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Task type '${task.type}' requires a 'promptTemplate' field`,
                    path: ['promptTemplate']
                });
            }
            break;
        case types_1.TaskType.TEXT_MANIPULATION:
            if (!task.functionBody) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Task type 'TEXT_MANIPULATION' requires a 'functionBody' field`,
                    path: ['functionBody']
                });
            }
            break;
        case types_1.TaskType.DATA_INPUT:
            if (task.staticValue === undefined) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Task type 'DATA_INPUT' requires a 'staticValue' field`,
                    path: ['staticValue']
                });
            }
            break;
        case types_1.TaskType.DISPLAY_CHART:
            if (!task.dataKey) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
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
exports.WorkflowSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, "Workflow name cannot be empty")
        .max(200, "Workflow name must be 200 characters or less"),
    description: zod_1.z.string()
        .min(1, "Workflow description cannot be empty")
        .max(1000, "Workflow description must be 1000 characters or less"),
    tasks: zod_1.z.array(exports.TaskSchema)
        .min(1, "Workflow must contain at least one task")
        .max(50, "Workflow cannot exceed 50 tasks")
}).superRefine((workflow, ctx) => {
    // Validate unique task IDs
    const taskIds = workflow.tasks.map(task => task.id);
    const duplicateIds = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
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
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Task '${task.id}' references non-existent dependency '${depId}'`,
                    path: ['tasks', taskIndex, 'dependencies', depIndex]
                });
            }
        });
    });
});
/**
 * Validates a workflow object against the comprehensive Zod schema
 *
 * @param data - The workflow data to validate
 * @returns ValidationResult with success status, validated data, or detailed errors
 */
function validateWorkflow(data) {
    try {
        const result = exports.WorkflowSchema.safeParse(data);
        if (result.success) {
            return {
                success: true,
                data: result.data
            };
        }
        else {
            const errors = [];
            const fieldErrors = {};
            result.error.issues.forEach((error) => {
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
    }
    catch (error) {
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
function hasCircularDependencies(workflow) {
    const visited = new Set();
    const recursionStack = new Set();
    const taskMap = new Map();
    workflow.tasks.forEach(task => taskMap.set(task.id, task));
    const dfsVisit = (taskId) => {
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
