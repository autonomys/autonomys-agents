import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getLastMemoryCid } from '../src/agents/tools/utils/blockchain/agentMemoryContract.js';
import { download } from '../src/agents/tools/utils/dsn/dsnDownload.js';
import { config } from '../src/config/index.js';
import { createLogger } from '../src/utils/logger.js';
import { VectorDB } from '../src/services/vectorDb/VectorDB.js';

const logger = createLogger('resurrect-cli');
let vectorDb: VectorDB | null = null;

const cleanup = async (signal?: string) => {
  if (signal) {
    logger.info(`Received ${signal} signal`);
  }
  if (vectorDb?.isOpen()) {
    logger.info('Closing vector database...');
    vectorDb.close();
    logger.info('Vector database closed successfully');
  }
  process.exit(0);
};

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGUSR2', () => cleanup('SIGUSR2'));

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

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  setupYargs().showHelp();
  process.exit(0);
}

const getLastProcessedCid = (stateFile: string): string | null => {
  try {
    if (!existsSync(stateFile)) {
      return null;
    }
    const data = JSON.parse(readFileSync(stateFile, 'utf-8'));
    return data.lastProcessedCid;
  } catch (error) {
    return null;
  }
};

const saveLastProcessedCid = (stateFile: string, cid: string): void => {
  try {
    writeFileSync(stateFile, JSON.stringify({ lastProcessedCid: cid }, null, 2));
    logger.info(`Saved last processed CID: ${cid}`);
  } catch (error) {
    logger.error('Failed to save last processed CID:', error);
  }
};

const processMemory = async (
  memory: any,
  cid: string,
  outputDir: string,
  vectorDb: VectorDB,
): Promise<void> => {
  const filename = `${cid}.json`;
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, JSON.stringify(memory, null, 2));

  try {
    await vectorDb.insert(JSON.stringify(memory), memory.timestamp);
    logger.info(`Processed memory ${cid}: Saved to file and vector database`);
  } catch (error) {
    logger.error(`Failed to store memory in vector database: ${cid}`, error);
  }
};

const fetchMemoryChain = async (
  currentCid: string,
  memoriesToFetch: number | null,
  outputDir: string,
  vectorDb: VectorDB,
  failedCids: Set<string> = new Set(),
  processedCount = 0,
): Promise<{ processedCount: number; failedCids: Set<string> }> => {
  if (
    !currentCid ||
    failedCids.has(currentCid) ||
    (memoriesToFetch !== null && processedCount >= memoriesToFetch)
  ) {
    return { processedCount, failedCids };
  }

  try {
    const content = await download(currentCid);
    await processMemory(content, currentCid, outputDir, vectorDb);
    processedCount++;

    if (content.previousCid) {
      return fetchMemoryChain(
        content.previousCid,
        memoriesToFetch,
        outputDir,
        vectorDb,
        failedCids,
        processedCount,
      );
    }
  } catch (error) {
    logger.error(`Failed to fetch memory ${currentCid}:`, error);
    failedCids.add(currentCid);
  }

  return { processedCount, failedCids };
};

const run = async () => {
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
  const stateFile = join(
    config.characterConfig.characterPath,
    'memories',
    'last-processed-cid.json',
  );

  try {
    mkdirSync(options.outputDir, { recursive: true });

    logger.info(`Using output directory: ${options.outputDir}`);
    logger.info(
      options.memoriesToFetch
        ? `Starting memory resurrection (fetching ${options.memoriesToFetch} memories)...`
        : 'Starting memory resurrection (fetching all memories)...',
    );

    const latestCid = await getLastMemoryCid();
    if (!latestCid) {
      logger.info('No memories found (empty CID)');
      return;
    }

    const lastProcessedCid = getLastProcessedCid(stateFile);
    if (lastProcessedCid === latestCid) {
      logger.info('Already up to date with latest CID');
      return;
    }

    vectorDb = new VectorDB('dsn');
    await vectorDb.open();

    logger.info(
      `Starting download from ${latestCid}${
        options.memoriesToFetch ? ` (max ${options.memoriesToFetch} memories)` : ' to genesis'
      }`,
    );

    const { processedCount, failedCids } = await fetchMemoryChain(
      latestCid,
      options.memoriesToFetch,
      options.outputDir,
      vectorDb,
    );

    saveLastProcessedCid(stateFile, latestCid);
    await cleanup();

    logger.info(
      `Memory resurrection complete. Processed: ${processedCount}, Failed: ${failedCids.size}`,
    );
    logger.info(`Memories saved to ${options.outputDir}`);
    await cleanup();
  } catch (error) {
    logger.error('Failed to resurrect memories:', error);
    await cleanup();
    process.exit(1);
  }
};

// Only run if we're not showing help
if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
  run().catch(async error => {
    logger.error('Unhandled error:', error);
    await cleanup();
    process.exit(1);
  });
}
