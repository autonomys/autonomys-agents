import { join } from 'path';
import { mkdirSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createLogger } from '../utils/logger.js';
import { downloadAllMemories } from './utils/resurrection.js';

const logger = createLogger('resurrect-cli');

interface CliOptions {
  outputDir: string;
  memoriesToFetch: number | null;
}

const parseArgs = (): CliOptions => {
  const argv = yargs(hideBin(process.argv))
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
    .check(argv => {
      if (argv.number !== null && (isNaN(argv.number) || argv.number <= 0)) {
        throw new Error('Number of memories must be a positive integer');
      }
      return true;
    })
    .help()
    .parseSync();

  return {
    outputDir: join(process.cwd(), argv.output as string),
    memoriesToFetch: argv.number as number | null,
  };
};

const main = async () => {
  try {
    const options = parseArgs();
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

main();
