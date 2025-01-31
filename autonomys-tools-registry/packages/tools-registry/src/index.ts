#!/usr/bin/env node
import { Command } from 'commander';
import { installTool } from './commands/install.js';
import { publishTool } from './commands/publish.js';
import { listTools } from './commands/list.js';

const program = new Command();

program
  .name('autonomy')
  .description('CLI to manage Autonomys tools')
  .version('0.1.0');

// Main command that users will use
program
  .argument('<tool-name>', 'Tool to install')
  .action(installTool);

// Additional commands
program
  .command('publish')
  .description('Publish a tool to the registry')
  .action(publishTool);

program
  .command('list')
  .description('List all available tools')
  .action(listTools);

program.parse();
