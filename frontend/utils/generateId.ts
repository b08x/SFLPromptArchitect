import { nanoid } from 'nanoid';

/**
 * @file generateId.ts
 * @description Provides a robust function to generate a unique identifier using nanoid.
 * Nanoid generates cryptographically secure, URL-friendly, unique string IDs.
 */

/**
 * Generates a unique identifier.
 * 
 * @returns {string} A unique, cryptographically secure string ID.
 * @example
 * const newUserId = generateId();
 * // "Uakgb_J5m9g-0JDMbcJqLJ"
 */
export function generateId(): string {
  return nanoid();
}