// Input validation utilities

export function isProblemId(input: string): boolean {
  return /^\d+$/.test(input);
}

export function isFileName(input: string): boolean {
  return !input.includes('/') && !input.includes('\\') && input.includes('.');
}

