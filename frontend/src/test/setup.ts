/**
 * @file setup.ts
 * @description Test setup file for Vitest. Configures global mocks, polyfills, and test utilities
 * that are needed across all test files.
 */

import { vi } from 'vitest';

// Mock sessionStorage and localStorage globally
const createStorageMock = () => {
  const store = new Map<string, string>();
  
  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((index: number) => [...store.keys()][index] || null)
  };
};

// Mock both storage types
Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true
});

// Mock Storage constructor
global.Storage = class Storage {
  private store = new Map<string, string>();
  
  getItem(key: string) { return this.store.get(key) || null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  get length() { return this.store.size; }
  key(index: number) { return [...this.store.keys()][index] || null; }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock Date.now for consistent testing
const mockDateNow = vi.fn(() => 1640995200000); // 2022-01-01 00:00:00 UTC
vi.stubGlobal('Date', {
  ...Date,
  now: mockDateNow
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset storage mocks
  (window.sessionStorage as any).getItem.mockClear();
  (window.sessionStorage as any).setItem.mockClear();
  (window.sessionStorage as any).removeItem.mockClear();
  (window.sessionStorage as any).clear.mockClear();
  
  (window.localStorage as any).getItem.mockClear();
  (window.localStorage as any).setItem.mockClear();
  (window.localStorage as any).removeItem.mockClear();
  (window.localStorage as any).clear.mockClear();
  
  // Reset Date.now mock
  mockDateNow.mockReturnValue(1640995200000);
});

// Export useful test utilities
export { mockDateNow };