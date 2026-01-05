// Input validation utilities
import { existsSync } from 'fs';
import { LANGUAGE_EXTENSIONS } from './templates.js';
import type { SupportedLanguage } from '../types.js';

export function validateProblemId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function validateLanguage(lang: string): lang is SupportedLanguage {
  return Object.keys(LANGUAGE_EXTENSIONS).includes(lang);
}

export function validateFilePath(path: string): boolean {
  return path.length > 0 && existsSync(path);
}

export function validateTitleSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export function isProblemId(input: string): boolean {
  return /^\d+$/.test(input);
}

export function isFileName(input: string): boolean {
  return !input.includes('/') && !input.includes('\\') && input.includes('.');
}

export function isFilePath(input: string): boolean {
  return input.includes('/') || input.includes('\\');
}
