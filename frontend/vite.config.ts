/**
 * @file vite.config.ts
 * @description Vite configuration file for the frontend application.
 * This configuration sets up essential build tools and development server options.
 * It includes path aliases for cleaner imports (e.g., `@/components` instead of `../components`)
 * and handles the loading of environment variables.
 *
 * @requires path
 * @requires vite
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Exports the Vite configuration.
 * The configuration is returned from a function to allow access to the current `mode` (development or production).
 *
 * @param {object} config - The Vite configuration object.
 * @param {string} config.mode - The current mode ('development', 'production').
 * @returns {import('vite').UserConfig} The Vite configuration object.
 */
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files located in the project root.
  // The third argument `''` ensures that all variables are loaded, not just those prefixed with `VITE_`.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      /**
       * @property {object} alias - Defines path aliases for module resolution.
       * This allows for cleaner, absolute-like imports within the project.
       */
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      /**
       * @property {object} proxy - Proxy configuration for development server.
       * This forwards API requests to the backend server during development.
       */
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      // This section can be used to expose environment variables to the client-side code.
      // Vite automatically exposes variables prefixed with `VITE_` via `import.meta.env`.
      // For variables without the prefix, you would define them here, for example:
      // 'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
  };
});
