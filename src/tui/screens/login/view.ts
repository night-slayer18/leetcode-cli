import chalk from 'chalk';
import { LoginScreenModel } from '../../types.js';
import { center, box, wrapLines, keyHint, renderModal, horizontalLine, renderLogo } from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

export function view(model: LoginScreenModel, width: number, height: number): string {
    const lines: string[] = [];
    const contentLines: string[] = [];

    // Header Content
    const logoLines = renderLogo(width);
    contentLines.push(...logoLines);
    contentLines.push('');
    contentLines.push(center(chalk.hex(colors.textMuted)('Please authenticate to access LeetCode features'), width));
    contentLines.push('');
    contentLines.push(''); // Extra spacing

    // Main Box Content
    if (model.step === 'instructions') {
        const contentWidth = Math.min(100, width - 4);
        
        const instructions = [
            chalk.hex(colors.warning).bold('How to Login:'),
            '',
            '1. Open https://leetcode.com in your browser',
            '2. Login to your account',
            '3. Open DevTools (F12) → Application → Cookies → leetcode.com',
            '4. Copy the values of ' + chalk.bold.cyan('LEETCODE_SESSION') + ' and ' + chalk.bold.cyan('csrftoken'),
            '',
            'Note: These credentials are stored locally on your machine.',
        ];
        
        const boxed = box(instructions, contentWidth, {
            title: 'Authentication Instructions',
            borderColor: colors.primary,
            padding: 1,
            borderStyle: 'round'
        });

        boxed.forEach(l => contentLines.push(center(l, width)));
        contentLines.push(''); // Spacing
        contentLines.push(center(keyHint('Enter', 'Continue to Login'), width));

    } else if (model.step === 'input' || model.step === 'verifying' || model.step === 'error') {
        
        const contentWidth = 100;
        const boxLines = [];
        
        const isSessionFocused = model.focusedField === 'session';
        const isCsrfFocused = model.focusedField === 'csrf';
        
        // Truncate for display to prevent box resizing/wrapping
        const truncate = (s: string) => s.length > 80 ? '...' + s.slice(-77) : s;

        const sessionDisplay = model.sessionToken 
            ? truncate(model.sessionToken) 
            : chalk.gray('Paste here...');
            
        const csrfDisplay = model.csrfToken 
            ? truncate(model.csrfToken) 
            : (model.sessionToken ? chalk.gray('Paste here...') : chalk.gray('Waiting...'));

        const sessionVal = model.sessionToken ? truncate(model.sessionToken) : chalk.gray('(empty)');
        const csrfVal = model.csrfToken ? truncate(model.csrfToken) : chalk.gray('(empty)');
        
        boxLines.push(chalk.bold('LEETCODE_SESSION:'));
        boxLines.push(isSessionFocused 
            ? chalk.hex(colors.primary)('> ') + sessionDisplay
            : '  ' + sessionVal + (model.sessionToken ? chalk.green(' ✔') : '')
        );
        boxLines.push('');
        
        boxLines.push(chalk.bold('csrftoken:'));
        boxLines.push(isCsrfFocused
            ? chalk.hex(colors.primary)('> ') + csrfDisplay
            : '  ' + csrfVal + (model.csrfToken ? chalk.green(' ✔') : '')
        );
        
        boxLines.push('');
        if (model.error) {
            boxLines.push(center(chalk.red(model.error), contentWidth - 4));
        } else if (model.step === 'verifying') {
            boxLines.push(center(chalk.yellow('Verifying credentials...'), contentWidth - 4));
        } else {
             boxLines.push(center(chalk.gray('Use Command+V to paste'), contentWidth - 4));
        }

        const boxed = box(boxLines, contentWidth, {
            title: 'Enter Credentials',
            borderColor: model.error ? colors.error : colors.primary,
            padding: 1
        });
        
        boxed.forEach(l => contentLines.push(center(l, width)));
        contentLines.push('');
        
        if (model.step === 'input') {
             contentLines.push(center(keyHint('Enter', model.focusedField === 'session' ? 'Next' : 'Login') + '  ' + keyHint('Esc', 'Cancel'), width));
        }
    } else if (model.step === 'success') {
         contentLines.push('');
         contentLines.push(center(chalk.green.bold('✔ Login Successful!'), width));
         contentLines.push(center('Redirecting...', width));
    }

    // Vertical Centering Calculation
    const totalContentHeight = contentLines.length;
    const paddingY = Math.max(0, Math.floor((height - totalContentHeight) / 2));

    for (let i = 0; i < paddingY; i++) lines.push('');
    lines.push(...contentLines);
    while (lines.length < height) lines.push('');

    return lines.slice(0, height).join('\n');
}
