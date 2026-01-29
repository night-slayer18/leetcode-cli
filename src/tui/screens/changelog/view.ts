import chalk from 'chalk';
import { ChangelogScreenModel, VersionEntry } from '../../types.js';
import { 
    keyHint
} from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

export function view(model: ChangelogScreenModel, width: number, height: number): string {
    const lines: string[] = [];

    const title = ' Changelog ';
    
    const titleBar = chalk.hex(colors.primary).bold(icons.code + title) + 
                     chalk.hex(colors.textMuted)('Latest updates and improvements');
    
    lines.push(titleBar);
    lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));
    lines.push(''); 

    const visibleHeight = height - 5; 

    if (model.loading) {
        lines.push('');
        lines.push('  ' + chalk.hex(colors.primary)('⋯ Loading release notes...'));
    } else if (model.error) {
        lines.push('');
        lines.push('  ' + chalk.red(icons.cross + ' Error loading changelog:'));
        lines.push('  ' + chalk.red(model.error));
    } else {
        
        const allLines: string[] = [];
        const contentWidth = width - 4; 

        model.entries.forEach(entry => {
            allLines.push(...renderEntry(entry, contentWidth));
            allLines.push(''); 
            allLines.push(chalk.hex(colors.border)(borders.horizontal.repeat(contentWidth)));
            allLines.push(''); 
        });

        const visibleLines = allLines.slice(model.scrollOffset, model.scrollOffset + visibleHeight);
        
        visibleLines.forEach(line => {
             lines.push('  ' + line);
        });
    }

    while (lines.length < height - 2) {
        lines.push('');
    }

    lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));
    
    const hints = [
        keyHint('j/k', 'Scroll'),
        keyHint('Esc', 'Back')
    ];
    lines.push(hints.join('  '));

    return lines.slice(0, height).join('\n');
}

function renderEntry(entry: VersionEntry, width: number): string[] {
    const lines: string[] = [];

    const versionText = ` ${entry.version} `;
    const header = entry.hasBreakingChanges
        ? chalk.bgRed.white.bold(versionText) + chalk.red(' ⚠️  BREAKING CHANGES')
        : chalk.bgHex(colors.primary).black.bold(versionText);
    
    lines.push(header);
    if (entry.date) {
        lines.push(chalk.gray(`  📅 ${entry.date}`));
    }
    lines.push('');

    const contentLines = entry.content.split('\n');
    let inList = false;

    for (const line of contentLines) {
        if (line.trim() === '' && !inList) continue; 

        if (line.startsWith('> **Release Date**') || line.startsWith('> **Focus**')) continue;

        if (line.startsWith('### ')) {
            const text = line.replace('### ', '').trim();
            lines.push('');
            
            let emoji = '📌';
            if (text.includes('Breaking')) emoji = '⚠️';
            else if (text.includes('Feature') || text.includes('New')) emoji = '🚀';
            else if (text.includes('Fix') || text.includes('Bug')) emoji = '🐛';
            
            lines.push(chalk.bold.yellow(`${emoji} ${text}`));
            inList = true;
            continue;
        }

        if (line.startsWith('#### ')) {
             lines.push(chalk.bold.white('   ' + line.replace('#### ', '').trim()));
             continue;
        }

        if (line.startsWith('- ')) {
            const text = line.replace('- ', '').trim();
            
            const boldMatch = text.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
            let itemLine = '';
            
            if (boldMatch) {
               itemLine = chalk.cyan(`• ${chalk.bold(boldMatch[1])}`) + 
                          (boldMatch[2] ? chalk.white(`: ${boldMatch[2]}`) : '');
            } else {
               itemLine = chalk.white(`• ${text}`);
            }

            lines.push(...wrapText('   ' + itemLine, width - 3, 5)); 
            continue;
        }

        if (line.startsWith('---')) continue;

        if (line.trim().length > 0) {
            lines.push(...wrapText('   ' + chalk.gray(line.trim()), width - 3, 3));
        }
    }

    return lines;
}

function wrapText(text: string, width: number, indent: number): string[] {

    if (stripAnsi(text).length <= width) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const indentStr = ' '.repeat(indent);

    words.forEach(word => {
        if (stripAnsi(currentLine + word).length + 1 > width) {
            lines.push(currentLine);
            currentLine = indentStr + word + ' '; 
        } else {
            currentLine += word + ' ';
        }
    });
    if (currentLine) lines.push(currentLine);
    
    return lines;
}

function stripAnsi(str: string): string {
    return str.replace(/\x1B\[\d+m/g, '');
}
