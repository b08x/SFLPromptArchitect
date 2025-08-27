/**
 * @file vitest.config.ts
 * @description Vitest configuration for the SFL Prompt Studio frontend.
 * Configures the testing environment for TypeScript, React components, and browser APIs.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM-like environment
    environment: 'jsdom',
    
    // Setup files to run before tests
    setupFiles: ['./src/test/setup.ts'],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Include patterns for test files
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Test timeout (increase for integration tests)
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '~': resolve(__dirname, './')
    }
  },
  
  // Define global constants for tests
  define: {
    __TEST__: true
  }
});