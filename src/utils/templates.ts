// Code templates for different programming languages
import type { SupportedLanguage, CodeSnippet } from '../types.js';
import striptags from 'striptags';
import { LANGUAGE_ALIAS_MAP, resolveSupportedLanguageFromLeetCodeSlug } from './languages.js';

// File extensions for each language
export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  typescript: 'ts',
  javascript: 'js',
  python3: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  kotlin: 'kt',
  swift: 'swift',
  sql: 'sql',
};

// LeetCode's language slugs mapped to our supported languages
export const LANG_SLUG_MAP: Record<string, SupportedLanguage> = { ...LANGUAGE_ALIAS_MAP };

export function getCodeTemplate(
  snippets: CodeSnippet[],
  preferredLanguage: SupportedLanguage
): CodeSnippet | null {
  // Try to find the preferred language first
  const preferred = snippets.find(
    (s) => resolveSupportedLanguageFromLeetCodeSlug(s.langSlug) === preferredLanguage
  );
  if (preferred) return preferred;

  // Fallback to any available snippet
  return snippets[0] ?? null;
}

export function getPremiumPlaceholderCode(
  language: SupportedLanguage,
  title: string
): string {
  const commentStyle = getCommentStyle(language);
  return `${commentStyle.single} Premium Problem - ${title}\n${commentStyle.single} Solution stub not available - visit LeetCode to view`;
}

export function generateSolutionFile(
  problemId: string,
  titleSlug: string,
  title: string,
  difficulty: string,
  codeSnippet: string,
  language: SupportedLanguage,
  problemContent?: string
): string {
  const commentStyle = getCommentStyle(language);
  const header = generateHeader(
    commentStyle,
    problemId,
    title,
    difficulty,
    titleSlug,
    problemContent
  );

  return `${header}\n\n${codeSnippet}\n`;
}

interface CommentStyle {
  single: string;
  blockStart: string;
  blockEnd: string;
  linePrefix: string;
}

function getCommentStyle(language: SupportedLanguage): CommentStyle {
  switch (language) {
    case 'python3':
      return { single: '#', blockStart: '"""', blockEnd: '"""', linePrefix: '' };
    case 'sql':
      return { single: '--', blockStart: '/*', blockEnd: '*/', linePrefix: ' * ' };
    case 'c':
    case 'cpp':
    case 'java':
    case 'typescript':
    case 'javascript':
    case 'go':
    case 'rust':
    case 'kotlin':
    case 'swift':
    case 'csharp':
    default:
      return { single: '//', blockStart: '/*', blockEnd: '*/', linePrefix: ' * ' };
  }
}

function formatProblemContent(html: string): string {
  let content = html;

  // Convert superscripts
  content = content.replace(/<sup>(.*?)<\/sup>/gi, '^$1');

  // Handle examples
  content = content.replace(/<strong class="example">Example (\d+):<\/strong>/gi, '\nExample $1:');

  // Convert list items
  content = content.replace(/<li>/gi, '• ');
  content = content.replace(/<\/li>/gi, '\n');

  // Convert paragraphs/breaks
  content = content.replace(/<\/p>/gi, '\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');

  // Remove HTML tags
  content = striptags(content) ?? '';

  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '<=')
    .replace(/&ge;/g, '>=')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&');

  // Clean up whitespace
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  return content;
}

function generateHeader(
  style: CommentStyle,
  problemId: string,
  title: string,
  difficulty: string,
  titleSlug: string,
  problemContent?: string
): string {
  const prefix = style.linePrefix;

  const lines: string[] = [
    style.blockStart,
    `${prefix}${problemId}. ${title}`,
    `${prefix}Difficulty: ${difficulty}`,
    `${prefix}https://leetcode.com/problems/${titleSlug}/`,
  ];

  if (problemContent) {
    lines.push(`${prefix}`);
    lines.push(`${prefix}${'─'.repeat(50)}`);
    lines.push(`${prefix}`);

    const formattedContent = formatProblemContent(problemContent);
    const contentLines = formattedContent.split('\n');

    for (const line of contentLines) {
      // Wrap long lines at ~70 chars
      if (line.length > 70) {
        const words = line.split(' ');
        let currentLine = '';
        for (const word of words) {
          if ((currentLine + ' ' + word).length > 70) {
            lines.push(`${prefix}${currentLine.trim()}`);
            currentLine = word;
          } else {
            currentLine += ' ' + word;
          }
        }
        if (currentLine.trim()) {
          lines.push(`${prefix}${currentLine.trim()}`);
        }
      } else {
        lines.push(`${prefix}${line}`);
      }
    }
  }

  lines.push(style.blockEnd);
  return lines.join('\n');
}

export function getSolutionFileName(
  problemId: string,
  titleSlug: string,
  language: SupportedLanguage
): string {
  const ext = LANGUAGE_EXTENSIONS[language];
  return `${problemId}.${titleSlug}.${ext}`;
}
