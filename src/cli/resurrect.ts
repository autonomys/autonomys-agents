import { join } from 'path';
import { mkdirSync } from 'fs';
import { createLogger } from '../utils/logger.js';
import { downloadAllMemories } from '../utils/resurrection.js';

const logger = createLogger('resurrect-cli');

const main = async () => {
  try {
    const outputDir = join(process.cwd(), 'memories');
    mkdirSync(outputDir, { recursive: true });

    logger.info('Starting memory resurrection...');
    const result = await downloadAllMemories(outputDir);

    logger.info(
      `Memory resurrection complete. Processed: ${result.processed}, Failed: ${result.failed}`,
    );
    logger.info(`Memories saved to ${outputDir}`);
  } catch (error) {
    logger.error('Failed to resurrect memories:', error);
    process.exit(1);
  }
};

main();
