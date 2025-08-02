"use strict";
/**
 * @file types.ts
 * @description This file contains TypeScript type definitions and interfaces for the backend.
 * It defines the data structures for database entities like Prompts and Workflows,
 * as well as the detailed SFL-structured prompt types that align with the frontend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = void 0;
/**
 * @enum {string} TaskType
 * @description Enumerates the different types of tasks that can be part of a workflow.
 */
var TaskType;
(function (TaskType) {
    TaskType["DATA_INPUT"] = "DATA_INPUT";
    TaskType["GEMINI_PROMPT"] = "GEMINI_PROMPT";
    TaskType["IMAGE_ANALYSIS"] = "IMAGE_ANALYSIS";
    TaskType["TEXT_MANIPULATION"] = "TEXT_MANIPULATION";
    TaskType["SIMULATE_PROCESS"] = "SIMULATE_PROCESS";
    TaskType["DISPLAY_CHART"] = "DISPLAY_CHART";
    TaskType["GEMINI_GROUNDED"] = "GEMINI_GROUNDED";
})(TaskType || (exports.TaskType = TaskType = {}));
