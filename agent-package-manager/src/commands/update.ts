import chalk from 'chalk';
import ora from 'ora';
import { UpdateOptions } from '../types/index.js';
import { execSync } from 'child_process';
import { getNpmPackageInfo } from '../utils/npm/index.js';

/**
 * Check for updates to the agent-os CLI
 * @param options Update command options
 */
export const update = async (options: UpdateOptions): Promise<void> => {
  const spinner = ora('Checking for updates...').start();
  
  try {
    const packageName = '@autonomys/agent-os';
    const currentVersion = execSync('agent-os -V', { encoding: 'utf-8' }).trim();
    
    // Fetch latest version from npm
    const npmInfo = await getNpmPackageInfo(packageName);
    const latestVersion = npmInfo.version;
    
    if (latestVersion === currentVersion) {
      spinner.succeed(chalk.green(`You are already using the latest version (${currentVersion}) of agent-os!`));
      return;
    }

    spinner.succeed(
      chalk.yellow(`Update available! ${chalk.blue(currentVersion)} → ${chalk.green(latestVersion)}`)
    );
    
    console.log('\nTo update, run:');
    console.log(chalk.cyan(`npm install -g ${packageName}@latest`));
    console.log(chalk.cyan(`yarn dlx ${packageName}@latest`));
    
    if (options.auto) {
      spinner.start('Updating automatically...');
      try {
        const updateCommand = `yarn dlx -g ${packageName}@latest`;
        execSync(updateCommand, { stdio: 'inherit' });
        spinner.succeed(chalk.green('Successfully updated to the latest version!'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to update automatically.'));
        console.error(chalk.red('Please update manually using the command above.'));
        if (error instanceof Error) {
          console.error(chalk.grey(error.message));
        }
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to check for updates.'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
}; 