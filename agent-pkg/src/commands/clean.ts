import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { CleanOptions, CommandResult } from '../types/index.js';
import { PACKAGES_DIR } from '../utils/shared/path.js';


const clean = async (options: CleanOptions): Promise<CommandResult> => {
  const spinner = ora('Cleaning autoOS cache...').start();
  spinner.stop();

  try {
    const files = await fs.readdir(PACKAGES_DIR);

    if (files.length === 0) {
      console.log(chalk.blue('Cache is already empty.'));
      return {
        success: true,
        message: 'Cache is already empty.',
      };
    }

    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(PACKAGES_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

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

    spinner.text = `Removing ${files.length} cached packages (${sizeMB} MB)...`;
    spinner.start();

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
};

export { clean };
