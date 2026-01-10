// Global test setup
import { vi, beforeEach, afterEach } from 'vitest';

// Mock console to capture output
export const mockConsole = {
  logs: [] as string[],
  errors: [] as string[],
  clear() {
    this.logs = [];
    this.errors = [];
  },
};

// Store original console methods
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  // Clear mock console before each test
  mockConsole.clear();
  
  // Mock console.log to capture output
  console.log = vi.fn((...args) => {
    mockConsole.logs.push(args.map(a => String(a)).join(' '));
  });
  
  console.error = vi.fn((...args) => {
    mockConsole.errors.push(args.map(a => String(a)).join(' '));
  });
});

afterEach(() => {
  // Restore console after each test
  console.log = originalLog;
  console.error = originalError;
  
  // Clear all mocks
  vi.clearAllMocks();
});

// Helper to get all console output as a single string
export function getConsoleOutput(): string {
  return mockConsole.logs.join('\n');
}

// Helper to check if output contains text (ignoring ANSI codes)
export function outputContains(text: string): boolean {
  const output = getConsoleOutput().replace(/\x1b\[[0-9;]*m/g, '');
  return output.includes(text);
}
