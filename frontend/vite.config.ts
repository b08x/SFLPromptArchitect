/**
 * @file vite.config.ts
 * @description Vite configuration file for the frontend application.
 * It sets up path aliases for cleaner imports and handles environment variables.
 *
 * @requires path
 * @requires vite
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files.
  // The third argument `''` loads all variables, not just those with VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      // Expose environment variables to the client.
      // Vite automatically exposes VITE_ prefixed variables, but being explicit can help debugging.
      // We are stringifying the values.
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});