import { Command } from 'commander';
import chalk from 'chalk';
import { install } from './commands/install.js';
import { publish } from './commands/publish.js';
import { list } from './commands/list.js';
import { config } from './commands/config.js';
import { clean } from './commands/clean.js';
import { tool } from './commands/tool.js';
import { initializeConfigAndCredentials } from './config/index.js';
import { credentialsExist } from './utils/credential/index.js';
import { ensureAutoOSDir } from './utils/shared/path.js';
import {
  CleanOptions,
  ConfigOptions,
  InstallOptions,
  PublishOptions,
  ToolCommandParams,
} from './types/index.js';

const checkMasterPassword = async () => {
  const isConfigCommand = process.argv.length > 2 && process.argv[2] === 'config';
  const isHelpCommand =
    process.argv.length > 2 && (process.argv[2] === '-h' || process.argv[2] === '--help');

  if ((await credentialsExist()) && !isConfigCommand && !isHelpCommand) {
    console.log(chalk.blue('\nℹ️  Information: You have stored credentials'));
  }
};

const program = new Command();

ensureAutoOSDir()
  .then(() => {
    return Promise.all([initializeConfigAndCredentials(), checkMasterPassword()]);
  })
  .then(() => {
    const installWrapper = async (toolName: string, options: InstallOptions) => {
      await install(toolName, options);
    };

    const publishWrapper = async (toolPath: string, options: PublishOptions) => {
      await publish(toolPath, options);
    };

    const listWrapper = async () => {
      await list();
    };

    const configWrapper = async (options: ConfigOptions) => {
      await config(options);
    };

    const cleanWrapper = async (options: CleanOptions) => {
      await clean(options);
    };

    const toolWrapper = async (options: ToolCommandParams) => {
      await tool(options);
    };

    program
      .name('autoOS')
      .description('Package manager for Autonomys agent tools')
      .version('0.1.0');

    program
      .command('install')
      .description('Install a tool from the registry or directly by CID')
      .argument('<tool-name>', 'Name of the tool to install')
      .option('-v, --version <version>', 'Specific version to install')
      .option('--cid <cid>', 'Install directly using Content ID (CID) from Autonomys Auto Drive')
      .option('--local', 'Install the tool locally to the current project instead of globally')
      .action(installWrapper);

    program
      .command('publish')
      .description('Publish a tool to the registry')
      .argument('<tool-path>', 'Path to the tool directory')
      .option(
        '--no-registry',
        'Skip updating the registry (only upload to Auto Drive and get a CID)',
      )
      .action(publishWrapper);

    program
      .command('list')
      .description('List available tools in the registry')
      .option('-d, --detailed', 'Show detailed information')
      .action(listWrapper);

    program
      .command('tool')
      .description('Inquire about a tool')
      .requiredOption('-n, --name <name>', 'Name of the tool to inquire about')
      .option('-v, --version <version>', 'Specific version to inquire about')
      .option('-a, --action <action>', 'Action to perform for example metadata')
      .action(toolWrapper);

    program
      .command('config')
      .description('Configure the autoOS CLI')
      .option('--credentials', 'Configure only credentials')
      .option('--settings', 'Configure only settings')
      .action(configWrapper);

    program
      .command('clean')
      .description('Clean cached packages and temporary files')
      .option('--force', 'Force clean without confirmation')
      .action(cleanWrapper);

    program.showHelpAfterError();

    program.parse();

    if (process.argv.length <= 2) {
      program.help();
    }
  })
  .catch(error => {
    console.error(chalk.red('Error initializing autoOS CLI:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
