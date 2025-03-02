import chalk from 'chalk';
import { CommandResult } from '../types/index.js';
import { promptForConfig, promptForCredentials } from '../utils/config.js';

/**
 * Configure the agentOS CLI
 * @param options Command options
 * @returns Command result
 */
export async function config(options: any = {}): Promise<CommandResult> {
  try {
    console.log(chalk.blue('agentOS CLI Configuration'));
    console.log(chalk.dim('This wizard will help you set up your agentOS CLI configuration.'));
    console.log('');
    
    if (options.credentials) {
      
      await promptForCredentials();
    } else if (options.settings) {
      await promptForConfig();
    } else {
      console.log(chalk.yellow('Configuration Settings'));
      await promptForConfig();
      
      console.log('');
      console.log(chalk.yellow('Credentials'));
      await promptForCredentials();
    }
    
    console.log('');
    console.log(chalk.green('✓ Configuration complete!'));
    console.log(chalk.dim('You can update your configuration at any time with:'));
    console.log(chalk.dim('  agentOS config'));
    
    return {
      success: true,
      message: 'Configuration completed successfully'
    };
  } catch (error) {
    console.error(chalk.red('Failed to configure agentOS CLI:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    return {
      success: false,
      message: `Configuration failed: ${error}`
    };
  }
} 