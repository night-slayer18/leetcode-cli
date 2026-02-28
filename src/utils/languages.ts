import type { CodeSnippet, SupportedLanguage } from '../types.js';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'typescript',
  'javascript',
  'python3',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'kotlin',
  'swift',
  'sql',
];

export const LANGUAGE_ALIAS_MAP: Record<string, SupportedLanguage> = {
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  python3: 'python3',
  python: 'python3',
  py: 'python3',
  java: 'java',
  'c++': 'cpp',
  cpp: 'cpp',
  c: 'c',
  'c#': 'csharp',
  csharp: 'csharp',
  cs: 'csharp',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
  kotlin: 'kotlin',
  kt: 'kotlin',
  swift: 'swift',
  sql: 'sql',
  mysql: 'sql',
  mssql: 'sql',
  postgresql: 'sql',
  postgres: 'sql',
  oracle: 'sql',
};

const LEETCODE_LANG_SLUG_MAP: Record<SupportedLanguage, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python3: 'python3',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  go: 'golang',
  rust: 'rust',
  kotlin: 'kotlin',
  swift: 'swift',
  sql: 'mysql',
};

const SQL_DIALECT_ALIASES: Record<string, string> = {
  sql: 'mysql',
  mysql: 'mysql',
  mssql: 'mssql',
  'ms sql': 'mssql',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  oracle: 'oracle',
};

function normalizeKey(input: string): string {
  return input.trim().toLowerCase();
}

function normalizeSqlDialect(input: string): string | null {
  const key = normalizeKey(input).replace(/[-_]+/g, ' ');
  return SQL_DIALECT_ALIASES[key] ?? null;
}

export function normalizeLanguageInput(input: string): SupportedLanguage | null {
  return LANGUAGE_ALIAS_MAP[normalizeKey(input)] ?? null;
}

export function resolveSupportedLanguageFromLeetCodeSlug(slug: string): SupportedLanguage | null {
  return normalizeLanguageInput(slug);
}

export function resolveSqlDialectLangSlug(
  codeSnippets?: readonly Pick<CodeSnippet, 'lang' | 'langSlug'>[] | null
): string {
  if (!codeSnippets || codeSnippets.length === 0) return 'mysql';

  const found = new Set<string>();
  for (const snippet of codeSnippets) {
    const fromSlug = normalizeSqlDialect(snippet.langSlug);
    if (fromSlug) {
      found.add(fromSlug);
      continue;
    }

    const fromName = normalizeSqlDialect(snippet.lang);
    if (fromName) {
      found.add(fromName);
    }
  }

  if (found.has('mysql')) return 'mysql';
  if (found.has('mssql')) return 'mssql';
  if (found.has('postgresql')) return 'postgresql';
  if (found.has('oracle')) return 'oracle';
  return 'mysql';
}

export function resolveLeetCodeLangSlug(
  language: SupportedLanguage,
  codeSnippets?: readonly Pick<CodeSnippet, 'lang' | 'langSlug'>[] | null
): string {
  if (language === 'sql') {
    return resolveSqlDialectLangSlug(codeSnippets);
  }

  return LEETCODE_LANG_SLUG_MAP[language];
}

export function getSupportedLanguagesLabel(): string {
  return SUPPORTED_LANGUAGES.join(', ');
}
