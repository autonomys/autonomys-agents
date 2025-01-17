import { join } from 'path';
import { mkdirSync } from 'fs';
import { createLogger } from '../utils/logger.js';
import MemoryResurrector from '../utils/resurrection.js';

const logger = createLogger('resurrect-cli');

async function main() {
  try {
    const outputDir = join(process.cwd(), 'memories');
    mkdirSync(outputDir, { recursive: true });

    logger.info('Starting memory resurrection...');
    const resurrector = new MemoryResurrector(outputDir);
    const result = await resurrector.downloadAllMemories();

    logger.info(
      `Memory resurrection complete. Processed: ${result.processed}, Failed: ${result.failed}`,
    );
    logger.info(`Memories saved to ${outputDir}`);
  } catch (error) {
    logger.error('Failed to resurrect memories:', error);
    process.exit(1);
  }
}

main();