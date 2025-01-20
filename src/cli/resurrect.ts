import { join } from 'path';
import { mkdirSync } from 'fs';
import { createLogger } from '../utils/logger.js';
import { downloadAllMemories } from './utils/resurrection.js';

const logger = createLogger('resurrect-cli');

interface CliOptions {
  outputDir: string;
  memoriesToFetch: number | null;
}

const parseArgs = (args: string[]): CliOptions => {
  const findNumberOption = (args: string[]): number | null => {
    const numberIndex = args.findIndex(arg => arg === '-n' || arg === '--number');
    if (numberIndex === -1) return null;
    
    const numberValue = parseInt(args[numberIndex + 1], 10);
    if (isNaN(numberValue) || numberValue <= 0) {
      throw new Error('Number of memories must be a positive integer');
    }
    return numberValue;
  };

  const findOutputDir = (args: string[]): string => {
    const nonFlagArgs = args.filter((arg, i) => 
      arg !== '-n' && 
      arg !== '--number' && 
      args[i - 1] !== '-n' && 
      args[i - 1] !== '--number'
    );
    return nonFlagArgs[0] || 'memories';
  };

  return {
    outputDir: join(process.cwd(), findOutputDir(args)),
    memoriesToFetch: findNumberOption(args),
  };
};

const main = async () => {
  try {
    const options = parseArgs(process.argv.slice(2));
    mkdirSync(options.outputDir, { recursive: true });

    logger.info(`Using output directory: ${options.outputDir}`);
    logger.info(options.memoriesToFetch 
      ? `Starting memory resurrection (fetching ${options.memoriesToFetch} memories)...`
      : 'Starting memory resurrection (fetching all memories)...'
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
