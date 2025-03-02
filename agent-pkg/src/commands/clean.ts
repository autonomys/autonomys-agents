import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { CommandResult } from '../types/index.js';

const AUTOOS_DIR = path.join(os.homedir(), '.autoOS');
const PACKAGES_DIR = path.join(AUTOOS_DIR, 'packages');

/**
 * Clean cached packages and other temporary files
 * @param options Command options
 * @returns Command result
 */
export async function clean(options: any = {}): Promise<CommandResult> {
  const spinner = ora('Cleaning autoOS cache...').start();
  spinner.stop();

  try {
    // Check if packages directory exists
    try {
      await fs.access(PACKAGES_DIR);
    } catch (error) {
      console.log(chalk.blue('No cache directory found. Nothing to clean.'));
      return {
        success: true,
        message: 'No cache directory found. Nothing to clean.',
      };
    }

    // Get all files in the packages directory
    const files = await fs.readdir(PACKAGES_DIR);

    if (files.length === 0) {
      console.log(chalk.blue('Cache is already empty.'));
      return {
        success: true,
        message: 'Cache is already empty.',
      };
    }

    // Count packages and calculate size
    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(PACKAGES_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    // Convert bytes to MB for display
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    // Ask for confirmation unless force option is used
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `This will remove ${files.length} cached packages (${sizeMB} MB). Continue?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Cache cleaning cancelled.'));
        return {
          success: false,
          message: 'Cache cleaning cancelled by user.',
        };
      }
    }

    // Restart spinner for deletion process
    spinner.text = `Removing ${files.length} cached packages (${sizeMB} MB)...`;
    spinner.start();

    // Delete all files in the packages directory
    for (const file of files) {
      const filePath = path.join(PACKAGES_DIR, file);
      await fs.unlink(filePath);
    }

    spinner.succeed(`Successfully cleaned ${files.length} cached packages (${sizeMB} MB)`);

    return {
      success: true,
      message: `Successfully cleaned ${files.length} cached packages (${sizeMB} MB)`,
      data: {
        cleanedFiles: files.length,
        freedSpace: totalSize,
      },
    };
  } catch (error) {
    spinner.fail('Failed to clean cache');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    return {
      success: false,
      message: `Failed to clean cache: ${error}`,
    };
  }
}
