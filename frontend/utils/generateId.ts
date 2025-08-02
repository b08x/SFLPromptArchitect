/**
 * @file generateId.ts
 * @description Provides a function to generate a UUID v4 string.
 * It prioritizes using the native `crypto.randomUUID()` for performance and security.
 * If unavailable, it falls back to a polyfill using `crypto.getRandomValues()`,
 * and finally to a `Math.random()` based implementation as a last resort.
 */

/**
 * Generate a UUID v4 string using crypto.randomUUID() if available,
 * falling back to a cryptographically secure polyfill implementation.
 * 
 * @returns {string} A UUID v4 string (e.g., "123e4567-e89b-12d3-a456-426614174000").
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant bits
    
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

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
