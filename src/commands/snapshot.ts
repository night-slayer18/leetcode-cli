// Snapshot command - save/restore solution versions
import chalk from 'chalk';
import { snapshotStorage, Snapshot } from '../storage/snapshots.js';
import { config } from '../storage/config.js';
import { findSolutionFile, getLangSlugFromExtension } from '../utils/fileUtils.js';
import { readFile, writeFile } from 'fs/promises';
import { extname, basename } from 'path';
import { diffLines } from 'diff';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export async function snapshotSaveCommand(
  problemId: string,
  name?: string
): Promise<void> {
  const workDir = config.getWorkDir();

  try {
    // Find the solution file
    const filePath = await findSolutionFile(workDir, problemId);
    
    if (!filePath) {
      console.log(chalk.red(`No solution file found for problem ${problemId}`));
      console.log(chalk.gray('Run `leetcode pick ' + problemId + '` first to create a solution file.'));
      return;
    }

    // Read current code
    const code = await readFile(filePath, 'utf-8');
    const ext = extname(filePath).slice(1);
    const lang = getLangSlugFromExtension(ext) || ext;

    // Extract title from filename (e.g., "1.two-sum.ts" -> "two-sum")
    const fileName = basename(filePath);
    const titleMatch = fileName.match(/^\d+\.(.+)\.\w+$/);
    const title = titleMatch ? titleMatch[1] : '';

    // Save the snapshot
    const result = snapshotStorage.save(problemId, title, code, lang, name);

    // Check for error (duplicate name)
    if ('error' in result) {
      console.log(chalk.red('✗ ' + result.error));
      return;
    }

    const snapshot = result;

    console.log(chalk.green('✓ Snapshot saved!'));
    console.log();
    console.log(`  ID:     ${chalk.cyan(snapshot.id)}`);
    console.log(`  Name:   ${chalk.white(snapshot.name)}`);
    console.log(`  Lines:  ${chalk.gray(snapshot.lines)}`);
    console.log(`  File:   ${chalk.gray(filePath)}`);
  } catch (error) {
    console.log(chalk.red('Failed to save snapshot'));
    if (error instanceof Error) {
      console.log(chalk.gray(error.message));
    }
  }
}

export async function snapshotListCommand(problemId: string): Promise<void> {
  const snapshots = snapshotStorage.list(problemId);

  if (snapshots.length === 0) {
    console.log(chalk.yellow(`No snapshots found for problem ${problemId}`));
    console.log(chalk.gray('Use `leetcode snapshot save ' + problemId + '` to create one.'));
    return;
  }

  const meta = snapshotStorage.getMeta(problemId);

  console.log();
  console.log(chalk.bold(`📸 Snapshots for Problem ${problemId}`));
  if (meta.problemTitle) {
    console.log(chalk.gray(`   ${meta.problemTitle}`));
  }
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  for (const snap of snapshots) {
    const timeAgo = formatTimeAgo(snap.createdAt);
    console.log(
      `  ${chalk.cyan(snap.id.toString().padStart(2))}. ${chalk.white(snap.name.padEnd(25))} ` +
      `${chalk.gray(snap.lines + ' lines')} ${chalk.gray('·')} ${chalk.gray(timeAgo)}`
    );
  }

  console.log();
  console.log(chalk.gray('Commands:'));
  console.log(chalk.gray(`  restore: leetcode snapshot restore ${problemId} <id|name>`));
  console.log(chalk.gray(`  diff:    leetcode snapshot diff ${problemId} <id1> <id2>`));
  console.log(chalk.gray(`  delete:  leetcode snapshot delete ${problemId} <id|name>`));
}

export async function snapshotRestoreCommand(
  problemId: string,
  idOrName: string
): Promise<void> {
  const workDir = config.getWorkDir();

  try {
    // Find the snapshot
    const snapshot = snapshotStorage.get(problemId, idOrName);

    if (!snapshot) {
      console.log(chalk.red(`Snapshot "${idOrName}" not found for problem ${problemId}`));
      console.log(chalk.gray('Run `leetcode snapshot list ' + problemId + '` to see available snapshots.'));
      return;
    }

    // Find the solution file
    const filePath = await findSolutionFile(workDir, problemId);

    if (!filePath) {
      console.log(chalk.red(`No solution file found for problem ${problemId}`));
      return;
    }

    // Read current code for backup
    const currentCode = await readFile(filePath, 'utf-8');
    
    // Auto-backup before restore
    const backupName = `backup-before-restore-${Date.now()}`;
    const ext = extname(filePath).slice(1);
    const lang = getLangSlugFromExtension(ext) || ext;
    snapshotStorage.save(problemId, '', currentCode, lang, backupName);

    // Get snapshot code
    const snapshotCode = snapshotStorage.getCode(problemId, snapshot);

    // Restore
    await writeFile(filePath, snapshotCode, 'utf-8');

    console.log(chalk.green('✓ Snapshot restored!'));
    console.log();
    console.log(`  Restored: ${chalk.cyan(snapshot.name)} (${snapshot.lines} lines)`);
    console.log(`  File:     ${chalk.gray(filePath)}`);
    console.log(`  Backup:   ${chalk.gray(backupName)}`);
  } catch (error) {
    console.log(chalk.red('Failed to restore snapshot'));
    if (error instanceof Error) {
      console.log(chalk.gray(error.message));
    }
  }
}

export async function snapshotDiffCommand(
  problemId: string,
  idOrName1: string,
  idOrName2: string
): Promise<void> {
  try {
    const snap1 = snapshotStorage.get(problemId, idOrName1);
    const snap2 = snapshotStorage.get(problemId, idOrName2);

    if (!snap1) {
      console.log(chalk.red(`Snapshot "${idOrName1}" not found`));
      return;
    }

    if (!snap2) {
      console.log(chalk.red(`Snapshot "${idOrName2}" not found`));
      return;
    }

    const code1 = snapshotStorage.getCode(problemId, snap1);
    const code2 = snapshotStorage.getCode(problemId, snap2);

    console.log();
    console.log(chalk.bold(`📊 Diff: ${snap1.name} → ${snap2.name}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();

    const diff = diffLines(code1, code2);

    let added = 0;
    let removed = 0;

    for (const part of diff) {
      const lines = part.value.split('\n').filter(l => l !== '');
      
      if (part.added) {
        added += lines.length;
        for (const line of lines) {
          console.log(chalk.green('+ ' + line));
        }
      } else if (part.removed) {
        removed += lines.length;
        for (const line of lines) {
          console.log(chalk.red('- ' + line));
        }
      } else {
        // Unchanged - show first and last few lines with ... in middle
        if (lines.length <= 4) {
          for (const line of lines) {
            console.log(chalk.gray('  ' + line));
          }
        } else {
          console.log(chalk.gray('  ' + lines[0]));
          console.log(chalk.gray('  ' + lines[1]));
          console.log(chalk.gray(`  ... (${lines.length - 4} more lines)`));
          console.log(chalk.gray('  ' + lines[lines.length - 2]));
          console.log(chalk.gray('  ' + lines[lines.length - 1]));
        }
      }
    }

    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(
      `${chalk.green('+' + added + ' added')} ${chalk.gray('·')} ` +
      `${chalk.red('-' + removed + ' removed')} ${chalk.gray('·')} ` +
      `${chalk.gray(snap1.lines + ' → ' + snap2.lines + ' lines')}`
    );
  } catch (error) {
    console.log(chalk.red('Failed to diff snapshots'));
    if (error instanceof Error) {
      console.log(chalk.gray(error.message));
    }
  }
}

export async function snapshotDeleteCommand(
  problemId: string,
  idOrName: string
): Promise<void> {
  const snapshot = snapshotStorage.get(problemId, idOrName);

  if (!snapshot) {
    console.log(chalk.red(`Snapshot "${idOrName}" not found for problem ${problemId}`));
    return;
  }

  const deleted = snapshotStorage.delete(problemId, idOrName);

  if (deleted) {
    console.log(chalk.green(`✓ Deleted snapshot: ${snapshot.name}`));
  } else {
    console.log(chalk.red('Failed to delete snapshot'));
  }
}
