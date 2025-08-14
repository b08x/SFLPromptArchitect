import { nanoid } from 'nanoid';

/**
 * @file generateId.ts
 * @description Provides a robust function to generate a unique identifier using nanoid.
 * Nanoid generates cryptographically secure, URL-friendly, unique string IDs.
 * This utility is used throughout the application for creating unique IDs for prompts,
 * workflows, and other entities.
 * 
 * @requires nanoid
 * @since 0.5.1
 */

/**
 * Generates a unique identifier.
 * Uses nanoid to create a cryptographically secure, URL-friendly unique string.
 * The generated ID is safe to use in URLs, HTML attributes, and database keys.
 * 
 * @returns {string} A unique, cryptographically secure string ID (typically 21 characters long).
 * 
 * @example
 * ```typescript
 * const newUserId = generateId();
 * console.log(newUserId); // "Uakgb_J5m9g-0JDMbcJqLJ"
 * 
 * const promptId = generateId();
 * const workflow = { id: generateId(), name: "My Workflow", ... };
 * ```
 * 
 * @since 0.5.1
 */
export function generateId(): string {
  return nanoid();
}