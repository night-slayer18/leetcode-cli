import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  normalizeLanguageInput,
  resolveLeetCodeLangSlug,
  resolveSqlDialectLangSlug,
} from '../../utils/languages.js';

describe('languages utility', () => {
  it('should include sql in supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('sql');
  });

  it('should normalize sql aliases to sql', () => {
    expect(normalizeLanguageInput('sql')).toBe('sql');
    expect(normalizeLanguageInput('mysql')).toBe('sql');
    expect(normalizeLanguageInput('postgresql')).toBe('sql');
  });

  it('should resolve sql dialect from snippets with mysql fallback', () => {
    expect(resolveSqlDialectLangSlug()).toBe('mysql');

    const mssql = resolveSqlDialectLangSlug([
      { lang: 'MS SQL Server', langSlug: 'mssql' },
    ]);
    expect(mssql).toBe('mssql');
  });

  it('should resolve non-sql languages to LeetCode slugs', () => {
    expect(resolveLeetCodeLangSlug('go')).toBe('golang');
    expect(resolveLeetCodeLangSlug('python3')).toBe('python3');
  });

  it('should resolve sql to problem-specific dialect', () => {
    const slug = resolveLeetCodeLangSlug('sql', [{ lang: 'MySQL', langSlug: 'mysql' }]);
    expect(slug).toBe('mysql');
  });
});
