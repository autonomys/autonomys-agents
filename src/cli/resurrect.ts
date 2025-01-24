import { join } from 'path';
import { mkdirSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Only import these if we're not showing help
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createLogger: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let downloadAllMemories: any;

const setupYargs = () =>
  yargs(hideBin(process.argv))
    .command('* [character]', 'Resurrect memories for a character', yargs => {
      yargs.positional('character', {
        type: 'string',
        description: 'Character name',
        demandOption: true,
      });
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output directory for memories',
      default: 'memories',
    })
    .option('number', {
      alias: 'n',
      type: 'number',
      description: 'Number of memories to fetch',
      default: null,
    })
    .help();

// Handle help first, before any other imports or initialization
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  setupYargs().showHelp();
  process.exit(0);
}

// Only import and run the rest of the code if we're not showing help
const run = async () => {
  // Dynamic imports to prevent initialization during help
  ({ createLogger } = await import('../utils/logger.js'));
  ({ downloadAllMemories } = await import('./utils/resurrection.js'));

  const logger = createLogger('resurrect-cli');

  interface CliOptions {
    outputDir: string;
    memoriesToFetch: number | null;
  }

  const parseArgs = (): CliOptions => {
    const argv = setupYargs()
      .check(argv => {
        if (!argv.character) {
          throw new Error('Character name is required');
        }
        if (argv.number !== null && (isNaN(argv.number) || argv.number <= 0)) {
          throw new Error('Number of memories must be a positive integer');
        }
        return true;
      })
      .parseSync();

    return {
      outputDir: join(process.cwd(), 'characters', argv.character as string, argv.output as string),
      memoriesToFetch: argv.number as number | null,
    };
  };

  const options = parseArgs();

  try {
    mkdirSync(options.outputDir, { recursive: true });

    logger.info(`Using output directory: ${options.outputDir}`);
    logger.info(
      options.memoriesToFetch
        ? `Starting memory resurrection (fetching ${options.memoriesToFetch} memories)...`
        : 'Starting memory resurrection (fetching all memories)...',
    );

    const result = await downloadAllMemories(options.outputDir, options.memoriesToFetch);

    logger.info(
      `Memory resurrection complete. Processed: ${result.processed}, Failed: ${result.failed}`,
    );
    logger.info(`Memories saved to ${options.outputDir}`);
  } catch (error) {
    logger.error('Failed to resurrect memories:', error);
    process.exit(1);
  }
};

// Only run if we're not showing help
if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
  run();
}
