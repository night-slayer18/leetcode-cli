import { describe, expect, it } from 'vitest';
import {
  detectLanguageFromFile,
  getExtensionForLanguage,
  getLangSlugFromExtension,
  isSupportedExtension,
} from '../../utils/fileUtils.js';

describe('file utils sql support', () => {
  it('should detect sql files as supported language', () => {
    expect(detectLanguageFromFile('/tmp/175.combine-two-tables.sql')).toBe('sql');
    expect(isSupportedExtension('sql')).toBe(true);
    expect(getExtensionForLanguage('sql')).toBe('sql');
  });

  it('should resolve sql extension to mysql by default', () => {
    expect(getLangSlugFromExtension('sql')).toBe('mysql');
  });

  it('should resolve sql extension to snippet dialect when available', () => {
    const slug = getLangSlugFromExtension('sql', [{ lang: 'MS SQL Server', langSlug: 'mssql' }]);
    expect(slug).toBe('mssql');
  });
});
