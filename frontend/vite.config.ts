/**
 * @file vite.config.ts
 * @description Vite configuration file for the frontend application.
 * It sets up path aliases to allow for cleaner imports.
 *
 * @requires path
 * @requires vite
 */

import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});