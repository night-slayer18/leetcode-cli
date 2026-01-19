// File utilities - shared file finding and language detection logic
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { SupportedLanguage } from '../types.js';
import { LANGUAGE_EXTENSIONS } from './templates.js';

// Max recursion depth for file searches (workDir/Difficulty/Category/file = 3 levels)
const MAX_SEARCH_DEPTH = 5;

export async function findSolutionFile(
  dir: string,
  problemId: string,
  currentDepth: number = 0
): Promise<string | null> {
  if (!existsSync(dir)) return null;
  if (currentDepth >= MAX_SEARCH_DEPTH) return null;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Skip hidden directories (like .notes)
    if (entry.name.startsWith('.')) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findSolutionFile(fullPath, problemId, currentDepth + 1);
      if (found) return found;
    } else if (entry.name.startsWith(`${problemId}.`)) {
      // Check it's a valid code file, not a markdown or other file
      const ext = entry.name.split('.').pop()?.toLowerCase();
      if (ext && ext in EXT_TO_LANG_MAP) {
        return fullPath;
      }
    }
  }
  return null;
}

export async function findFileByName(
  dir: string,
  fileName: string,
  currentDepth: number = 0
): Promise<string | null> {
  if (!existsSync(dir)) return null;
  if (currentDepth >= MAX_SEARCH_DEPTH) return null;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findFileByName(fullPath, fileName, currentDepth + 1);
      if (found) return found;
    } else if (entry.name === fileName) {
      return fullPath;
    }
  }
  return null;
}

const EXT_TO_LANG_MAP: Record<string, SupportedLanguage> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python3',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  kt: 'kotlin',
  swift: 'swift',
};

export function detectLanguageFromFile(filePath: string): SupportedLanguage | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext ? (EXT_TO_LANG_MAP[ext] ?? null) : null;
}

export function getLangSlugFromExtension(ext: string): string | null {
  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    py: 'python3',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'golang',
    rs: 'rust',
    kt: 'kotlin',
    swift: 'swift',
  };
  return langMap[ext.toLowerCase()] ?? null;
}

export function isSupportedExtension(ext: string): boolean {
  return ext.toLowerCase() in EXT_TO_LANG_MAP;
}

export function getExtensionForLanguage(language: SupportedLanguage): string {
  return LANGUAGE_EXTENSIONS[language];
}
