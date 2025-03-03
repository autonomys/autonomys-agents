import chalk from 'chalk';
import { CommandResult } from '../types/index.js';
import { promptForConfig, promptForCredentials } from '../utils/config.js';

/**
 * Configure the autoOS CLI
 * @param options Command options
 * @returns Command result
 */
export const config = async (options: any = {}): Promise<CommandResult> => {
  console.log(chalk.blue.bold('autoOS CLI Configuration\n'));

  const configureSettings = !options.credentials || options.settings;
  const configureCredentials = !options.settings || options.credentials;

  if (configureSettings) {
    console.log(chalk.cyan('=== General Settings ==='));
    await promptForConfig();
    console.log('');
  }

  if (configureCredentials) {
    console.log(chalk.cyan('=== Credentials Management ==='));
    console.log(chalk.yellow('• Your credentials are encrypted with your master password'));
    console.log(
      chalk.yellow('• You can store your master password securely in the system keychain'),
    );
    console.log(
      chalk.yellow('• Alternatively, you can use the AUTOOS_MASTER_PASSWORD environment variable'),
    );
    console.log('');

    await promptForCredentials();
  }

  console.log(chalk.green.bold('\nConfiguration complete! 🎉'));

  return { success: true, message: 'Configuration updated successfully' };
};
