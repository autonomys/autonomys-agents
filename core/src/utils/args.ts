import yargs from 'yargs';
import { getProjectRoot } from './utils.js';

interface ParsedArgs {
  character?: string;
  workspace?: string;
  headless: boolean;
}

let cachedArgs: ParsedArgs | null = null;

export const parseArgs = (): ParsedArgs => {
  if (cachedArgs) {
    return cachedArgs;
  }
  const args = yargs(process.argv.slice(2))
    .command('$0 [character]', 'Start the agent', yargs => {
      return yargs.positional('character', {
        describe: 'Character name',
        type: 'string',
      });
    })
    .option('headless', {
      describe: 'Run in headless mode',
      type: 'boolean',
      default: false,
    })
    .option('workspace', {
      describe: 'Custom workspace root path',
      type: 'string',
      default: getProjectRoot(),
    })
    .help('h')
    .alias('h', 'help')
    .parseSync();

  cachedArgs = args;
  return args;
};

/**
 * Get the workspace path, respecting command line arguments
 */
export const getWorkspacePath = (): string => {
  const args = parseArgs();
  return args.workspace || getProjectRoot();
};

/**
 * Get the character name if provided
 */
export const getCharacterName = (): string => {
  const args = parseArgs();
  return args.character || '';
};

/**
 * Check if the application should run in headless mode
 */
export const isHeadlessMode = (): boolean => {
  const args = parseArgs();
  return args.headless;
};
