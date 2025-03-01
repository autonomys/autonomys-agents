#!/usr/bin/env node

import { config } from 'dotenv';
import { Command } from 'commander';
import chalk from 'chalk';
import { install } from './commands/install.js';
import { publish } from './commands/publish.js';
import { list } from './commands/list.js';

// Load environment variables from .env file
config();

const program = new Command();

// Wrappers that consume the return values
const installWrapper = async (...args: any[]) => { await install(args[0], args[1]); };
const publishWrapper = async (...args: any[]) => { await publish(args[0], args[1]); };
const listWrapper = async (...args: any[]) => { await list(args[0]); };

// CLI metadata
program
  .name('agentOS')
  .description('Package manager for Autonomys agent tools')
  .version('0.1.0');

// Register commands
program
  .command('install')
  .description('Install a tool from the registry or directly by CID')
  .argument('<tool-name>', 'Name of the tool to install')
  .option('-v, --version <version>', 'Specific version to install')
  .option('--cid <cid>', 'Install directly using Content ID (CID) from Autonomys DSN')
  .option('--local', 'Install the tool locally to the current project instead of globally')
  .action(installWrapper);

program
  .command('publish')
  .description('Publish a tool to the registry')
  .argument('<tool-path>', 'Path to the tool directory')
  .option('--no-registry', 'Skip updating the registry (only upload to DSN and get a CID)')
  .action(publishWrapper);

program
  .command('list')
  .description('List available tools in the registry')
  .option('-d, --detailed', 'Show detailed information')
  .action(listWrapper);

// Error handling
program.showHelpAfterError();

// Parse and execute
program.parse();

// If no args, show help
if (process.argv.length <= 2) {
  program.help();
} 