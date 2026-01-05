// Notes command - manage problem notes
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { config } from '../storage/config.js';
import { openInEditor } from '../utils/editor.js';
import { leetcodeClient } from '../api/client.js';
import { validateProblemId } from '../utils/validation.js';

type NoteAction = 'view' | 'edit';

export async function notesCommand(problemId: string, action?: string): Promise<void> {
  if (!validateProblemId(problemId)) {
    console.log(chalk.red(`Invalid problem ID: ${problemId}`));
    console.log(chalk.gray('Problem ID must be a positive integer'));
    return;
  }

  const noteAction: NoteAction = action === 'view' ? 'view' : 'edit';
  
  const notesDir = join(config.getWorkDir(), '.notes');
  const notePath = join(notesDir, `${problemId}.md`);

  if (!existsSync(notesDir)) {
    await mkdir(notesDir, { recursive: true });
  }

  if (noteAction === 'view') {
    await viewNote(notePath, problemId);
  } else {
    await editNote(notePath, problemId);
  }
}

async function viewNote(notePath: string, problemId: string): Promise<void> {
  if (!existsSync(notePath)) {
    console.log(chalk.yellow(`No notes found for problem ${problemId}`));
    console.log(chalk.gray(`Use "leetcode note ${problemId} edit" to create notes`));
    return;
  }

  try {
    const content = await readFile(notePath, 'utf-8');
    console.log();
    console.log(chalk.bold.cyan(`📝 Notes for Problem ${problemId}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(content);
  } catch (error) {
    console.log(chalk.red('Failed to read notes'));
    if (error instanceof Error) {
      console.log(chalk.gray(error.message));
    }
  }
}

async function editNote(notePath: string, problemId: string): Promise<void> {
  if (!existsSync(notePath)) {
    const template = await generateNoteTemplate(problemId);
    await writeFile(notePath, template, 'utf-8');
    console.log(chalk.green(`✓ Created notes file for problem ${problemId}`));
  }

  console.log(chalk.gray(`Opening: ${notePath}`));
  await openInEditor(notePath);
}

async function generateNoteTemplate(problemId: string): Promise<string> {
  let header = `# Problem ${problemId} Notes\n\n`;
  
  const credentials = config.getCredentials();
  if (credentials) {
    try {
      leetcodeClient.setCredentials(credentials);
      const problem = await leetcodeClient.getProblemById(problemId);
      if (problem) {
        header = `# ${problemId}. ${problem.title}\n\n`;
        header += `**Difficulty:** ${problem.difficulty}\n`;
        header += `**URL:** https://leetcode.com/problems/${problem.titleSlug}/\n`;
        
        if (problem.topicTags.length > 0) {
          header += `**Topics:** ${problem.topicTags.map(t => t.name).join(', ')}\n`;
        }
        header += '\n---\n\n';
      }
    } catch {
      // Use simple header if fetch fails
    }
  }

  return `${header}## Approach

<!-- Describe your approach to solving this problem -->


## Key Insights

<!-- What patterns or techniques did you use? -->


## Complexity

- **Time:** O(?)
- **Space:** O(?)


## Code Notes

<!-- Any notes about the implementation -->


## Mistakes / Learnings

<!-- What did you learn from this problem? -->

`;
}
