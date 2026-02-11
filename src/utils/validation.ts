// Input validation utilities
import { resolve, sep } from 'path';

export function isProblemId(input: string): boolean {
  return /^\d+$/.test(input);
}

export function isFileName(input: string): boolean {
  return !input.includes('/') && !input.includes('\\') && input.includes('.');
}

const WORKSPACE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const SNAPSHOT_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,63}$/;

export function isValidWorkspaceName(name: string): boolean {
  return WORKSPACE_NAME_REGEX.test(name.trim());
}

export function isValidSnapshotName(name: string): boolean {
  return SNAPSHOT_NAME_REGEX.test(name.trim());
}

export function isPathInsideWorkDir(filePath: string, workDir: string): boolean {
  const resolvedFilePath = resolve(filePath);
  const resolvedWorkDir = resolve(workDir);

  // Use path.sep for cross-platform compatibility (/ on Unix, \ on Windows)
  const workDirWithSep = resolvedWorkDir.endsWith(sep) ? resolvedWorkDir : resolvedWorkDir + sep;

  return resolvedFilePath === resolvedWorkDir || resolvedFilePath.startsWith(workDirWithSep);
}
