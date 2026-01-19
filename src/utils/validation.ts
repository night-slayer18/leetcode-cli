// Input validation utilities
import { resolve, sep } from 'path';

export function isProblemId(input: string): boolean {
  return /^\d+$/.test(input);
}

export function isFileName(input: string): boolean {
  return !input.includes('/') && !input.includes('\\') && input.includes('.');
}
export function isPathInsideWorkDir(filePath: string, workDir: string): boolean {
  const resolvedFilePath = resolve(filePath);
  const resolvedWorkDir = resolve(workDir);

  // Use path.sep for cross-platform compatibility (/ on Unix, \ on Windows)
  const workDirWithSep = resolvedWorkDir.endsWith(sep) ? resolvedWorkDir : resolvedWorkDir + sep;

  return resolvedFilePath === resolvedWorkDir || resolvedFilePath.startsWith(workDirWithSep);
}
