import chalk from 'chalk';
import { LoginScreenModel } from '../../types.js';
import {
  center,
  box,
  wrapLines,
  keyHint,
  renderModal,
  horizontalLine,
  renderLogo,
} from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

export function view(model: LoginScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentLines: string[] = [];

  // Header Content
  const logoLines = renderLogo(width);
  contentLines.push(...logoLines);
  contentLines.push('');
  contentLines.push(
    center(chalk.hex(colors.textMuted)('Please authenticate to access LeetCode features'), width)
  );
  contentLines.push('');
  contentLines.push(''); // Extra spacing

  // Main Box Content
  if (model.step === 'instructions') {
    const contentWidth = Math.max(28, Math.min(100, width - 4));

    const instructions = [
      chalk.hex(colors.warning).bold('How to Login:'),
      '',
      '1. Continue to choose your LeetCode site',
      '2. We will show the correct cookie domain on the next screen',
      '3. Copy the values of ' +
        chalk.bold.cyan('LEETCODE_SESSION') +
        ' and ' +
        chalk.bold.cyan('csrftoken'),
      '',
      'Default storage: system keychain.',
      'Use LEETCODECLI_CREDENTIAL_BACKEND=file + LEETCODECLI_MASTER_KEY for encrypted file mode.',
      'If LEETCODE_SESSION and LEETCODE_CSRF_TOKEN are set, login runs in read-only env mode.',
    ];

    const boxed = box(instructions, contentWidth, {
      title: 'Authentication Instructions',
      borderColor: colors.primary,
      padding: 1,
      borderStyle: 'round',
    });

    boxed.forEach((l) => contentLines.push(center(l, width)));
    contentLines.push(''); // Spacing
    contentLines.push(center(keyHint('Enter', 'Choose Site'), width));
  } else if (model.step === 'site') {
    const contentWidth = Math.max(28, Math.min(100, width - 4));
    const options = [
      model.site === 'leetcode.com'
        ? chalk.hex(colors.primary)('> leetcode.com (Global)')
        : '  leetcode.com (Global)',
      model.site === 'leetcode.cn'
        ? chalk.hex(colors.primary)('> leetcode.cn (China)')
        : '  leetcode.cn (China)',
      '',
      chalk.gray('Use Up/Down/Tab to switch sites.'),
    ];

    const boxed = box(options, contentWidth, {
      title: 'Choose Site',
      borderColor: colors.primary,
      padding: 1,
      borderStyle: 'round',
    });

    boxed.forEach((l) => contentLines.push(center(l, width)));
    contentLines.push('');
    contentLines.push(center(keyHint('Enter', 'Continue') + '  ' + keyHint('Esc', 'Back'), width));
  } else if (model.step === 'input' || model.step === 'verifying' || model.step === 'error') {
    const contentWidth = Math.max(28, Math.min(100, width - 4));
    const boxLines = [];
    const domain = model.site === 'leetcode.cn' ? 'leetcode.cn' : 'leetcode.com';

    const isSessionFocused = model.focusedField === 'session';
    const isCsrfFocused = model.focusedField === 'csrf';

    // Truncate for display to prevent box resizing/wrapping
    const tokenPreview = Math.max(12, contentWidth - 20);
    const truncate = (s: string) =>
      s.length > tokenPreview ? '...' + s.slice(-(tokenPreview - 3)) : s;

    const sessionDisplay = model.sessionToken
      ? truncate(model.sessionToken)
      : chalk.gray('Paste here...');

    const csrfDisplay = model.csrfToken
      ? truncate(model.csrfToken)
      : model.sessionToken
        ? chalk.gray('Paste here...')
        : chalk.gray('Waiting...');

    const sessionVal = model.sessionToken ? truncate(model.sessionToken) : chalk.gray('(empty)');
    const csrfVal = model.csrfToken ? truncate(model.csrfToken) : chalk.gray('(empty)');

    boxLines.push(chalk.bold('LEETCODE_SESSION:'));
    boxLines.push(
      isSessionFocused
        ? chalk.hex(colors.primary)('> ') + sessionDisplay
        : '  ' + sessionVal + (model.sessionToken ? chalk.green(' ✔') : '')
    );
    boxLines.push('');

    boxLines.push(chalk.bold('csrftoken:'));
    boxLines.push(
      isCsrfFocused
        ? chalk.hex(colors.primary)('> ') + csrfDisplay
        : '  ' + csrfVal + (model.csrfToken ? chalk.green(' ✔') : '')
    );

    boxLines.push('');
    boxLines.push(
      chalk.gray(`Cookie source: https://${domain} → DevTools → Application → Cookies → ${domain}`)
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
      padding: 1,
    });

    boxed.forEach((l) => contentLines.push(center(l, width)));
    contentLines.push('');

    if (model.step === 'input') {
      contentLines.push(
        center(
          keyHint('Enter', model.focusedField === 'session' ? 'Next' : 'Login') +
            '  ' +
            keyHint('Esc', 'Cancel'),
          width
        )
      );
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
