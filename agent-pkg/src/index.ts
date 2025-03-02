import { Command } from 'commander';
import chalk from 'chalk';
import { install } from './commands/install.js';
import { publish } from './commands/publish.js';
import { list } from './commands/list.js';
import { config } from './commands/config.js';
import { clean } from './commands/clean.js';
import { initializeConfigAndCredentials, credentialsExist } from './utils/config.js';


async function checkMasterPassword() {
  const isConfigCommand = process.argv.length > 2 && process.argv[2] === 'config';
  
  if (await credentialsExist() && !isConfigCommand) {
    if (!process.env.AGENTOS_MASTER_PASSWORD) {
      console.log(chalk.red('\n🛑 ERROR: Master password environment variable not set'));
      console.log(chalk.yellow('Due to issues with interactive password prompts, you must set your master password as an environment variable:'));
      console.log(chalk.cyan('\n  export AGENTOS_MASTER_PASSWORD="your-master-password"\n'));
      console.log(chalk.yellow('You can add this to your shell profile or run it before using agentOS commands.'));
      console.log(chalk.yellow('After setting the environment variable, run your command again.\n'));
      console.log(chalk.yellow('To reconfigure your credentials, use the config command:\n'));
      console.log(chalk.cyan('  node dist/index.js config\n'));
      process.exit(1);
    }
  }
}

const program = new Command();

Promise.all([
  initializeConfigAndCredentials(),
  checkMasterPassword()
]).then(() => {
  const installWrapper = async (...args: any[]) => { await install(args[0], args[1]); };
  const publishWrapper = async (...args: any[]) => { await publish(args[0], args[1]); };
  const listWrapper = async (...args: any[]) => { await list(args[0]); };
  const configWrapper = async (...args: any[]) => { await config(args[0]); };
  const cleanWrapper = async (...args: any[]) => { await clean(args[0]); };

  program
    .name('agentOS')
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
    .option('--no-registry', 'Skip updating the registry (only upload to Auto Drive and get a CID)')
    .action(publishWrapper);

  program
    .command('list')
    .description('List available tools in the registry')
    .option('-d, --detailed', 'Show detailed information')
    .action(listWrapper);
    
  program
    .command('config')
    .description('Configure the agentOS CLI')
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
}).catch(error => {
  console.error(chalk.red('Error initializing agentOS CLI:'));
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
}); 