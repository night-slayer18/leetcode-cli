// Input validation utilities
import { resolve } from 'path';

export function isProblemId(input: string): boolean {
  return /^\d+$/.test(input);
}

export function isFileName(input: string): boolean {
  return !input.includes('/') && !input.includes('\\') && input.includes('.');
}
export function isPathInsideWorkDir(filePath: string, workDir: string): boolean {
  const resolvedFilePath = resolve(filePath);
  const resolvedWorkDir = resolve(workDir);
  const workDirWithSep = resolvedWorkDir.endsWith('/') ? resolvedWorkDir : resolvedWorkDir + '/';
  
  return resolvedFilePath === resolvedWorkDir || resolvedFilePath.startsWith(workDirWithSep);
}

