import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createExperienceManager } from '../core/src/blockchain/agentExperience/index.js';
import { characterName, config } from '../core/src/config/index.js';
import { createLogger } from '../core/src/utils/logger.js';
import { VectorDB } from '../core/src/services/vectorDb/VectorDB.js';
import { getVectorDB, closeVectorDB } from '../core/src/services/vectorDb/vectorDBPool.js';
import {
  ExperienceManager,
  AgentExperience,
  AgentExperienceV0,
} from '../core/src/blockchain/agentExperience/types.js';
import { rootDir } from './utils';

const logger = createLogger('resurrect-cli');
let vectorDb: VectorDB;

const cleanupOnApplicationClose = async (signal?: string) => {
  if (signal) {
    logger.info(`Received ${signal}, cleaning up...`);
  }
  if (vectorDb) {
    closeVectorDB('experiences');
  }
  process.exit(0);
};

process.on('SIGINT', () => cleanupOnApplicationClose('SIGINT'));
process.on('SIGTERM', () => cleanupOnApplicationClose('SIGTERM'));
process.on('SIGUSR2', () => cleanupOnApplicationClose('SIGUSR2'));

const setupYargs = () =>
  yargs(hideBin(process.argv))
    .command('* [character]', 'Resurrect memories for a character', yargs => {
      yargs.positional('character', {
        type: 'string',
        description: 'Name of the character to resurrect memories for',
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
const isAgentExperience = (x: any): x is AgentExperience => 'header' in x;

const getLastProcessedCid = (cidTrackingFile: string): string | null => {
  try {
    if (!existsSync(cidTrackingFile)) {
      return null;
    }
    const data = JSON.parse(readFileSync(cidTrackingFile, 'utf-8'));
    return data.lastProcessedCid;
  } catch (error) {
    logger.error('Failed to get last processed CID:', error);
    return null;
  }
};

const saveLastProcessedCid = (cidTrackingFile: string, cid: string): void => {
  try {
    writeFileSync(cidTrackingFile, JSON.stringify({ lastProcessedCid: cid }, null, 2));
    logger.info(`Saved last processed CID: ${cid}`);
  } catch (error) {
    logger.error('Failed to save last processed CID:', error);
  }
};

const processMemory = async (
  memory: AgentExperience | AgentExperienceV0,
  cid: string,
  outputDir: string,
  vectorDb: VectorDB,
): Promise<void> => {
  try {
    const timestamp = isAgentExperience(memory) ? memory.header.timestamp : memory.timestamp;
    await vectorDb.insert(JSON.stringify(memory), timestamp);
    const filename = `${cid}.json`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, JSON.stringify(memory, null, 2));

    logger.info(`Processed memory ${cid}: Saved to file and vector database`);
  } catch (error) {
    logger.error(`Failed to store memory in vector database: ${cid}`, error);
    throw error;
  }
};

const fetchMemoryChain = async (
  currentCid: string,
  memoriesToFetch: number | null,
  outputDir: string,
  vectorDb: VectorDB,
  experienceManager: ExperienceManager,
  failedCid: Set<string> = new Set(),
  processedCount = 0,
): Promise<{ processedCount: number; failedCid: Set<string> }> => {
  if (
    !currentCid ||
    failedCid.has(currentCid) ||
    (memoriesToFetch !== null && processedCount >= memoriesToFetch)
  ) {
    return { processedCount, failedCid };
  }

  try {
    const content = await experienceManager.retrieveExperience(currentCid);
    await processMemory(content, currentCid, outputDir, vectorDb);
    processedCount++;

    const previousCid = isAgentExperience(content)
      ? content.header.previousCid
      : content.previousCid;

    if (previousCid) {
      return fetchMemoryChain(
        previousCid,
        memoriesToFetch,
        outputDir,
        vectorDb,
        experienceManager,
        failedCid,
        processedCount,
      );
    }
  } catch (error) {
    logger.error(`Failed to fetch or write memory ${currentCid}:`, error);
    failedCid.add(currentCid);
  }

  return { processedCount, failedCid };
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
      outputDir: join(rootDir, 'characters', argv.character as string, argv.output as string),
      memoriesToFetch: argv.number as number | null,
    };
  };

  const options = parseArgs();
  const cidTrackingFile = join(
    rootDir,
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
    const character = config.characterConfig;

    const experienceManager =
      config.blockchainConfig.PRIVATE_KEY &&
      config.blockchainConfig.RPC_URL &&
      config.blockchainConfig.CONTRACT_ADDRESS &&
      config.autoDriveConfig.AUTO_DRIVE_API_KEY
        ? await createExperienceManager({
            autoDriveApiOptions: {
              apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY,
              network: config.autoDriveConfig.AUTO_DRIVE_NETWORK,
            },
            uploadOptions: {
              compression: true,
              password: config.autoDriveConfig.AUTO_DRIVE_ENCRYPTION_PASSWORD,
            },
            walletOptions: {
              privateKey: config.blockchainConfig.PRIVATE_KEY,
              rpcUrl: config.blockchainConfig.RPC_URL,
              contractAddress: config.blockchainConfig.CONTRACT_ADDRESS,
            },
            agentOptions: {
              agentName: characterName,
              agentPath: character.characterPath,
            },
          })
        : undefined;

    if (!experienceManager) {
      logger.error('Missing configuration for experience manager');
      await cleanupOnApplicationClose();
      return;
    }

    const latestCid = await experienceManager.cidManager.getLastMemoryCid();
    if (!latestCid) {
      logger.info('No memories found (empty CID)');
      return;
    }

    const lastProcessedCid = getLastProcessedCid(cidTrackingFile);
    if (lastProcessedCid === latestCid) {
      logger.info('Already up to date with latest CID');
      return;
    }

    vectorDb = getVectorDB('experiences');
    await vectorDb.open();

    logger.info(
      `Starting downloading memories from ${latestCid}${
        options.memoriesToFetch ? ` (max ${options.memoriesToFetch} memories)` : ' to genesis'
      }`,
    );

    const { processedCount, failedCid } = await fetchMemoryChain(
      latestCid,
      options.memoriesToFetch,
      options.outputDir,
      vectorDb,
      experienceManager,
    );

    saveLastProcessedCid(cidTrackingFile, latestCid);
    logger.info(
      `Memory resurrection complete. Processed: ${processedCount}, Failed: ${failedCid.size}`,
    );
    logger.info(`Memories saved to ${options.outputDir}`);
    await cleanupOnApplicationClose();
  } catch (error) {
    logger.error('Failed to resurrect memories:', error);
    await cleanupOnApplicationClose();
  }
};

// Only run if we're not showing help
if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
  run().catch(async error => {
    logger.error('Unhandled error:', error);
    await cleanupOnApplicationClose();
  });
}
