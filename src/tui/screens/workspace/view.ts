import chalk from 'chalk';
import { WorkspaceScreenModel } from '../../types.js';
import { 
    center, 
    keyHint,
    truncate,
    padEnd
} from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

export function view(model: WorkspaceScreenModel, width: number, height: number): string {
    const lines: string[] = [];

    const title = ' Workspaces ';
    const titleBar = chalk.hex(colors.primary).bold(icons.folder + title) + 
                     chalk.hex(colors.textMuted)('Manage your problem-solving contexts');
    
    lines.push(titleBar);
    lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));
    lines.push(''); 

    const listHeight = height - 6; 

    const pageSize = listHeight;
    const pageStart = Math.floor(model.cursor / pageSize) * pageSize;
    const toShow = model.workspaces.slice(pageStart, pageStart + pageSize);

    if (model.workspaces.length === 0) {
        lines.push('  ' + chalk.yellow('No workspaces found.'));
    } else {
        toShow.forEach((ws, idx) => {
            const absoluteIndex = pageStart + idx;
            const isSelected = absoluteIndex === model.cursor;
            const isActive = ws === model.activeWorkspace;

            const selector = isSelected ? chalk.hex(colors.primary).bold('▶ ') : '  ';

            const activeIndicator = isActive ? chalk.green('● ') : '○ ';
            
            const name = ws;
            const content = `${selector}${activeIndicator}${name}`;
            const paddedContent = padEnd(content, width - 2); 

            if (isSelected) {
                
                lines.push(chalk.bgHex(colors.bgHighlight)('  ' + stripAnsi(content).padEnd(width - 2)));
            } else {
                 lines.push('  ' + content);
            }
        });
    }

    while (lines.length < height - 3) { 
        lines.push('');
    }

    lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));

    if (model.showCreateInput) {
        const prompt = chalk.cyan('Create New Workspace: ');
        const inputDisplay = model.newWorkspaceName + '█';
        lines.push(prompt + inputDisplay);
        lines.push(chalk.hex(colors.textMuted)(keyHint('Enter', 'Create') + '  ' + keyHint('Esc', 'Cancel')));
    } 
    else if (model.showDeleteConfirm) {
        const warning = chalk.bgRed.white.bold(' DELETE WORKSPACE? ') + ' ' + 
                        chalk.red(`Are you sure you want to delete "${model.workspaces[model.cursor]}"?`);
        lines.push(warning);
        lines.push(chalk.hex(colors.textMuted)(keyHint('Enter', 'Yes') + '  ' + keyHint('Esc', 'No')));
    }
    else {
        lines.push(chalk.hex(colors.textMuted)(`Active: ${model.activeWorkspace}`));
        const hints = [
            keyHint('↑/↓', 'Nav'),
            keyHint('Enter', 'Switch'),
            keyHint('c', 'Create'),
            keyHint('D', 'Delete'),
            keyHint('Esc', 'Back')
        ];
        lines.push(hints.join('  '));
    }

    if (model.error) {
        
        lines[lines.length - 1] = chalk.bgRed.white(` Error: ${model.error} `);
    }

    if (lines.length > height) {
        return lines.slice(0, height).join('\n');
    }
    while (lines.length < height) {
        lines.push('');
    }

    return lines.join('\n');
}

function stripAnsi(str: string): string {
    return str.replace(/\x1B\[\d+m/g, '');
}
