/**
 * @file generateId.ts
 * @description Provides a robust function to generate a UUID v4 string for unique identification.
 * It intelligently selects the best available method for generating the UUID in the current environment.
 *
 * The function prioritizes using the native `crypto.randomUUID()` for optimal performance and security.
 * If `crypto.randomUUID()` is not available, it falls back to a polyfill that uses the equally secure `crypto.getRandomValues()`.
 * As a final resort for older environments where the Web Crypto API is not supported, it uses a `Math.random()`-based implementation.
 */

/**
 * Generates a universally unique identifier (UUID) version 4.
 *
 * This function attempts to use the most secure and efficient method available in the runtime environment:
 * 1. **`crypto.randomUUID()`**: The modern, preferred, and most performant method.
 * 2. **`crypto.getRandomValues()`**: A fallback for environments that support the Web Crypto API but not `randomUUID`. It is still cryptographically secure.
 * 3. **`Math.random()`**: A final fallback for legacy environments. Note that this method is not cryptographically secure.
 *
 * @returns {string} A UUID v4 string in the format "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
 *
 * @example
 * const newUserId = generateId();
 * // "123e4567-e89b-12d3-a456-426614174000"
 */
export function generateId(): string {
  // Use the modern and preferred method if available.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback to a cryptographically secure polyfill if getRandomValues is available.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set the version bits to 4 (0100)
    array[6] = (array[6] & 0x0f) | 0x40;
    // Set the variant bits to RFC4122 (10xx)
    array[8] = (array[8] & 0x3f) | 0x80;
    
    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  // Final, non-cryptographically secure fallback for older environments.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}