// Changelog command - display release notes from GitHub
import chalk from 'chalk';
import ora from 'ora';
import got from 'got';
import { isNewerVersion } from '../utils/semver.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fetch releases.md from GitHub raw URL
const RELEASES_URL = 'https://raw.githubusercontent.com/night-slayer18/leetcode-cli/main/docs/releases.md';

interface ChangelogOptions {
  latest?: boolean;
  breaking?: boolean;
  all?: boolean;
}

interface VersionEntry {
  version: string;
  content: string;
  hasBreakingChanges: boolean;
}

/**
 * Get current installed version from package.json
 */
function getCurrentVersion(): string {
  try {
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch {
    return '0.0.0';
  }
}

// isNewerVersion is imported from ../utils/semver.js

/**
 * Fetch releases.md content from GitHub
 */
async function fetchReleasesContent(): Promise<string> {
  const response = await got(RELEASES_URL, {
    timeout: { request: 10000 },
    retry: { limit: 2 },
  }).text();
  return response;
}

/**
 * Parse releases.md into version entries
 */
function parseReleases(content: string): VersionEntry[] {
  const entries: VersionEntry[] = [];
  
  // Split by version headers (## v1.0.0 or ## 1.0.0)
  const versionRegex = /^## v?([\d.]+)/gm;
  const matches = [...content.matchAll(versionRegex)];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    // Normalize to always have 'v' prefix
    const version = `v${match[1]}`;
    const startIndex = match.index! + match[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const versionContent = content.slice(startIndex, endIndex).trim();
    
    // Check if this version has breaking changes
    const hasBreakingChanges = versionContent.includes('⚠️ Breaking Change');
    
    entries.push({
      version,
      content: versionContent,
      hasBreakingChanges,
    });
  }
  
  return entries;
}

/**
 * Render release content with enhanced visual formatting
 */
function renderReleaseContent(version: string, content: string, isBreaking: boolean): void {
  // Version header with box
  const versionLine = isBreaking 
    ? chalk.bgRed.white.bold(` ${version} `) + chalk.red(' ⚠️  BREAKING CHANGES')
    : chalk.bgCyan.black.bold(` ${version} `);
  
  console.log(versionLine);
  console.log();
  
  // Process content line by line with enhanced formatting
  const lines = content.split('\n');
  let inList = false;
  
  for (const line of lines) {
    // Skip empty lines at start
    if (line.trim() === '' && !inList) continue;
    
    // Release date/focus info
    if (line.startsWith('> **Release Date**')) {
      const date = line.replace('> **Release Date**: ', '').trim();
      console.log(chalk.gray(`  📅 ${date}`));
      continue;
    }
    if (line.startsWith('> **Focus**')) {
      const focus = line.replace('> **Focus**: ', '').trim();
      console.log(chalk.gray(`  🎯 ${focus}`));
      console.log();
      continue;
    }
    
    // Section headers with emojis
    if (line.startsWith('### ')) {
      const header = line.replace('### ', '').trim();
      console.log();
      
      // Check if header already has an emoji
      const hasEmoji = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(header);
      
      if (hasEmoji) {
        // Header already has emoji, use as-is
        console.log(chalk.bold.yellow(`  ${header}`));
      } else {
        // Add appropriate emoji based on content
        let emoji = '📌';
        if (header.includes('Breaking')) emoji = '⚠️';
        else if (header.includes('Feature') || header.includes('New')) emoji = '🚀';
        else if (header.includes('Fix') || header.includes('Bug')) emoji = '🐛';
        else if (header.includes('Security')) emoji = '🔒';
        else if (header.includes('Improvement')) emoji = '✨';
        else if (header.includes('Architecture')) emoji = '🏗️';
        else if (header.includes('Testing')) emoji = '🧪';
        else if (header.includes('Config')) emoji = '⚙️';
        
        console.log(chalk.bold.yellow(`  ${emoji} ${header}`));
      }
      inList = true;
      continue;
    }
    
    // Subheaders
    if (line.startsWith('#### ')) {
      const subheader = line.replace('#### ', '').trim();
      console.log(chalk.bold.white(`     ${subheader}`));
      continue;
    }
    
    // List items with better indentation
    if (line.startsWith('- **')) {
      // Bold item with description
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
      if (match) {
        console.log(chalk.cyan(`     • ${chalk.bold(match[1])}`) + (match[2] ? chalk.white(`: ${match[2]}`) : ''));
      } else {
        console.log(chalk.cyan(`     • ${line.replace('- ', '')}`));
      }
      continue;
    }
    
    if (line.startsWith('- ')) {
      const item = line.replace('- ', '').trim();
      console.log(chalk.white(`     • ${item}`));
      continue;
    }
    
    // Skip horizontal rules and empty quotes
    if (line.startsWith('---') || line.trim() === '>') continue;
    
    // Other content
    if (line.trim()) {
      console.log(chalk.gray(`     ${line.trim()}`));
    }
  }
}

export async function changelogCommand(version?: string, options: ChangelogOptions = {}): Promise<void> {
  const spinner = ora('Fetching changelog...').start();
  
  try {
    const content = await fetchReleasesContent();
    spinner.stop();
    
    const entries = parseReleases(content);
    
    if (entries.length === 0) {
      console.log(chalk.yellow('No release entries found.'));
      return;
    }
    
    // Get current installed version
    const currentVersion = getCurrentVersion();
    
    // Filter versions based on options
    let filteredEntries = entries;
    
    if (version) {
      // Show specific version
      const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
      filteredEntries = entries.filter(e => e.version === normalizedVersion);
      
      if (filteredEntries.length === 0) {
        console.log(chalk.red(`Version ${version} not found in changelog.`));
        console.log(chalk.gray('Available versions: ' + entries.map(e => e.version).join(', ')));
        return;
      }
    } else if (options.latest) {
      // Show only latest version
      filteredEntries = entries.slice(0, 1);
    } else if (options.breaking) {
      // Show only versions with breaking changes
      filteredEntries = entries.filter(e => e.hasBreakingChanges);
      
      if (filteredEntries.length === 0) {
        console.log(chalk.green('✓ No breaking changes in any release.'));
        return;
      }
    } else if (options.all) {
      // Show all versions
      filteredEntries = entries;
    } else {
      // Default: show only versions newer than current installed version
      filteredEntries = entries.filter(e => isNewerVersion(e.version, currentVersion));
      
      if (filteredEntries.length === 0) {
        console.log(chalk.green(`✓ You're on the latest version (${currentVersion})`));
        console.log(chalk.gray('Use --all to see the full changelog.'));
        return;
      }
      
      console.log(chalk.gray(`Showing changes since your version (${currentVersion})`));
      console.log(chalk.gray('Use --all to see the full changelog.'));
    }
    
    // Header
    console.log();
    console.log(chalk.bold.cyan('📋 LeetCode CLI Release Notes'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    
    // Render each entry
    for (const entry of filteredEntries) {
      renderReleaseContent(entry.version, entry.content, entry.hasBreakingChanges);
      console.log(chalk.gray('─'.repeat(60)));
      console.log();
    }
    
    // Footer with version count
    if (!version && !options.latest) {
      const breakingCount = entries.filter(e => e.hasBreakingChanges).length;
      console.log(chalk.gray(`Showing ${filteredEntries.length} of ${entries.length} releases`));
      if (breakingCount > 0 && !options.breaking) {
        console.log(chalk.yellow(`${breakingCount} release(s) contain breaking changes. Use --breaking to filter.`));
      }
    }
    
  } catch (error) {
    spinner.fail('Failed to fetch changelog');
    console.log(chalk.gray('  Could not fetch release notes from GitHub.'));
    console.log(chalk.gray('  Visit: https://github.com/night-slayer18/leetcode-cli/blob/main/docs/releases.md'));
  }
}
