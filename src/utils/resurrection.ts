import { createLogger } from '../utils/logger.js';
import { getLastMemoryCid } from '../agents/tools/utils/agentMemoryContract.js';
import { download } from '../agents/tools/utils/dsnDownload.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const logger = createLogger('memory-resurrector');
const STATE_FILE = join(process.cwd(), 'memories', 'last-processed-cid.json');

class MemoryResurrector {
  private failedCids: Set<string> = new Set();
  private processedCount: number = 0;

  constructor(private outputDir: string) {}

  private getLastProcessedCid(): string | null {
    try {
      if (!existsSync(STATE_FILE)) {
        return null;
      }
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
      return data.lastProcessedCid;
    } catch (error) {
      logger.error('Failed to read last processed CID:', error);
      return null;
    }
  }

  private saveLastProcessedCid(cid: string): void {
    try {
      writeFileSync(STATE_FILE, JSON.stringify({ lastProcessedCid: cid }, null, 2));
      logger.info(`Saved last processed CID: ${cid}`);
    } catch (error) {
      logger.error('Failed to save last processed CID:', error);
    }
  }

  private async fetchMemoryChain(currentCid: string, stopAtCid: string | null): Promise<void> {
    if (!currentCid || this.failedCids.has(currentCid) || currentCid === stopAtCid) {
      return;
    }

    try {
      const content = await download(currentCid);

      const filename = `${currentCid}.json`;
      const filepath = join(this.outputDir, filename);
      writeFileSync(filepath, JSON.stringify(content, null, 2));

      this.processedCount++;
      logger.info(`Successfully fetched and saved memory ${currentCid}`);

      if (content.previousCid && content.previousCid !== stopAtCid) {
        await this.fetchMemoryChain(content.previousCid, stopAtCid);
      }
    } catch (error) {
      logger.error(`Failed to fetch memory ${currentCid}:`, error);
      this.failedCids.add(currentCid);
    }
  }

  async downloadAllMemories(): Promise<{ processed: number; failed: number }> {
    const latestCid = await getLastMemoryCid();
    if (!latestCid) {
      logger.info('No memories found (empty CID)');
      return { processed: 0, failed: 0 };
    }

    const lastProcessedCid = this.getLastProcessedCid();
    if (lastProcessedCid === latestCid) {
      logger.info('Already up to date with latest CID');
      return { processed: 0, failed: 0 };
    }

    logger.info(`Starting download from ${latestCid} to ${lastProcessedCid || 'genesis'}`);
    await this.fetchMemoryChain(latestCid, lastProcessedCid);

    this.saveLastProcessedCid(latestCid);

    logger.info(`Downloaded ${this.processedCount} memories, failed CIDs: ${this.failedCids.size}`);

    return {
      processed: this.processedCount,
      failed: this.failedCids.size,
    };
  }
}

export default MemoryResurrector;
