// Update command - check for updates and provide upgrade instructions
import chalk from 'chalk';
import ora from 'ora';
import got from 'got';
import { versionStorage } from '../storage/version.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@night-slayer18/leetcode-cli/latest';
const PACKAGE_NAME = '@night-slayer18/leetcode-cli';

interface UpdateOptions {
  checkOnly?: boolean;
  force?: boolean;
}

/**
 * Get current version from package.json
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

/**
 * Fetch latest version from npm registry
 */
async function fetchLatestVersion(): Promise<{ version: string; hasBreakingChanges: boolean }> {
  const response = await got(NPM_REGISTRY_URL, {
    timeout: { request: 10000 },
    retry: { limit: 2 },
  }).json<{ version: string }>();
  
  const latestVersion = response.version;
  const currentVersion = getCurrentVersion();
  
  // Check if major version bump (breaking change)
  const currentMajor = parseInt(currentVersion.split('.')[0]);
  const latestMajor = parseInt(latestVersion.split('.')[0]);
  const hasBreakingChanges = latestMajor > currentMajor;
  
  return { version: latestVersion, hasBreakingChanges };
}

/**
 * Compare semver versions
 */
function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return true;
    if (latestParts[i] < currentParts[i]) return false;
  }
  return false;
}

/**
 * Display update notification box
 */
function displayUpdateBox(currentVersion: string, latestVersion: string, hasBreakingChanges: boolean): void {
  console.log();
  
  const boxWidth = 60;
  const topBorder = '╭' + '─'.repeat(boxWidth - 2) + '╮';
  const bottomBorder = '╰' + '─'.repeat(boxWidth - 2) + '╯';
  
  console.log(chalk.cyan(topBorder));
  
  // Update available message
  const updateMsg = `  🚀 Update available: ${chalk.gray(currentVersion)} → ${chalk.green(latestVersion)}`;
  console.log(chalk.cyan('│') + updateMsg.padEnd(boxWidth + 18) + chalk.cyan('│'));
  
  if (hasBreakingChanges) {
    console.log(chalk.cyan('│') + ''.padEnd(boxWidth - 2) + chalk.cyan('│'));
    const breakingMsg = `  ${chalk.yellow('⚠️  This update contains breaking changes!')}`;
    console.log(chalk.cyan('│') + breakingMsg.padEnd(boxWidth + 20) + chalk.cyan('│'));
    const changelogMsg = `  ${chalk.gray('Run:')} leetcode changelog ${chalk.gray('to review changes')}`;
    console.log(chalk.cyan('│') + changelogMsg.padEnd(boxWidth + 16) + chalk.cyan('│'));
  }
  
  console.log(chalk.cyan('│') + ''.padEnd(boxWidth - 2) + chalk.cyan('│'));
  const updateCmd = `  ${chalk.gray('Run:')} npm update -g ${PACKAGE_NAME}`;
  console.log(chalk.cyan('│') + updateCmd.padEnd(boxWidth + 8) + chalk.cyan('│'));
  
  console.log(chalk.cyan(bottomBorder));
  console.log();
}

export async function updateCommand(options: UpdateOptions): Promise<void> {
  const currentVersion = getCurrentVersion();
  
  // Clear cache if force flag is set
  if (options.force) {
    versionStorage.clearCache();
  }
  
  // Check if we have cached data and it's not forced
  const cached = versionStorage.getCached();
  let latestVersion: string;
  let hasBreakingChanges: boolean;
  
  if (cached && !versionStorage.shouldCheck() && !options.force) {
    latestVersion = cached.latestVersion;
    hasBreakingChanges = cached.hasBreakingChanges;
  } else {
    const spinner = ora('Checking for updates...').start();
    
    try {
      const result = await fetchLatestVersion();
      latestVersion = result.version;
      hasBreakingChanges = result.hasBreakingChanges;
      
      // Update cache
      versionStorage.updateCache(latestVersion, hasBreakingChanges);
      spinner.stop();
    } catch (error) {
      spinner.fail('Failed to check for updates');
      if (process.env.DEBUG) {
        console.log(chalk.gray(`  Debug: ${error instanceof Error ? error.message : String(error)}`));
      }
      console.log(chalk.gray('  Could not reach npm registry. Check your internet connection.'));
      return;
    }
  }
  
  // Compare versions
  if (isNewerVersion(currentVersion, latestVersion)) {
    displayUpdateBox(currentVersion, latestVersion, hasBreakingChanges);
    
    if (!options.checkOnly) {
      if (hasBreakingChanges) {
        console.log(chalk.yellow('💡 Tip: Review the changelog before updating to check for breaking changes.'));
        console.log(chalk.gray('   Run: leetcode changelog\n'));
      }
    }
  } else {
    console.log();
    console.log(chalk.green('✓') + ` You're on the latest version (${chalk.cyan(currentVersion)})`);
    console.log();
  }
}

/**
 * Startup update check - non-blocking, runs in background
 */
export async function checkForUpdatesOnStartup(): Promise<void> {
  // Skip if check not needed
  if (!versionStorage.shouldCheck()) {
    const cached = versionStorage.getCached();
    if (cached && isNewerVersion(getCurrentVersion(), cached.latestVersion)) {
      displayStartupBanner(getCurrentVersion(), cached.latestVersion, cached.hasBreakingChanges);
    }
    return;
  }
  
  // Fetch in background (don't await in hot path)
  try {
    const result = await fetchLatestVersion();
    versionStorage.updateCache(result.version, result.hasBreakingChanges);
    
    if (isNewerVersion(getCurrentVersion(), result.version)) {
      displayStartupBanner(getCurrentVersion(), result.version, result.hasBreakingChanges);
    }
  } catch {
    // Silently fail - don't interrupt user's command
  }
}

/**
 * Compact startup banner
 */
function displayStartupBanner(current: string, latest: string, hasBreaking: boolean): void {
  console.log();
  if (hasBreaking) {
    console.log(chalk.yellow(`⚠️  Update ${current} → ${latest} available (breaking changes!)`));
    console.log(chalk.gray('   Run: leetcode changelog && leetcode update'));
  } else {
    console.log(chalk.cyan(`🚀 Update available: ${current} → ${latest}`));
    console.log(chalk.gray('   Run: leetcode update'));
  }
  console.log();
}
