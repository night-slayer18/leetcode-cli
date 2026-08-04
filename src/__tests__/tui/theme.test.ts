import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyTheme,
  colors,
  darkPalette,
  lightPalette,
  normalizeThemeInput,
  resolveTheme,
  SUPPORTED_THEMES,
} from '../../tui/theme.js';

const ORIGINAL_COLORFGBG = process.env.COLORFGBG;

describe('TUI theme', () => {
  beforeEach(() => {
    delete process.env.COLORFGBG;
    applyTheme('dark');
  });

  afterEach(() => {
    if (ORIGINAL_COLORFGBG === undefined) {
      delete process.env.COLORFGBG;
    } else {
      process.env.COLORFGBG = ORIGINAL_COLORFGBG;
    }
    applyTheme('dark');
  });

  describe('normalizeThemeInput', () => {
    it('accepts every supported theme name', () => {
      for (const name of SUPPORTED_THEMES) {
        expect(normalizeThemeInput(name)).toBe(name);
      }
    });

    it('is case-insensitive and trims whitespace', () => {
      expect(normalizeThemeInput('  LIGHT ')).toBe('light');
      expect(normalizeThemeInput('Dark')).toBe('dark');
      expect(normalizeThemeInput('AUTO')).toBe('auto');
    });

    it('returns null for unsupported input', () => {
      expect(normalizeThemeInput('solarized')).toBeNull();
      expect(normalizeThemeInput('')).toBeNull();
    });
  });

  describe('resolveTheme', () => {
    it('returns the explicit palette for dark/light', () => {
      expect(resolveTheme('dark')).toBe('dark');
      expect(resolveTheme('light')).toBe('light');
    });

    it('falls back to dark when auto has no signal', () => {
      expect(resolveTheme('auto')).toBe('dark');
      expect(resolveTheme(undefined)).toBe('dark');
    });

    it('detects light terminals via COLORFGBG background code >= 7', () => {
      process.env.COLORFGBG = '0;15';
      expect(resolveTheme('auto')).toBe('light');
    });

    it('detects dark terminals via COLORFGBG background code < 7', () => {
      process.env.COLORFGBG = '15;0';
      expect(resolveTheme('auto')).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('swaps the mutable colors palette to light', () => {
      applyTheme('light');
      expect(colors.bg).toBe(lightPalette.bg);
      expect(colors.text).toBe(lightPalette.text);
    });

    it('restores the dark palette', () => {
      applyTheme('light');
      applyTheme('dark');
      expect(colors.bg).toBe(darkPalette.bg);
      expect(colors.text).toBe(darkPalette.text);
    });

    it('keeps the same object identity so importers keep working', () => {
      const before = colors;
      applyTheme('light');
      expect(colors).toBe(before);
    });
  });
});
