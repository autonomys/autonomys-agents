import { createLogger } from '../../utils/logger.js';
import { getLastMemoryCid } from '../../agents/tools/utils/agentMemoryContract.js';
import { downloadCharacter } from '../../agents/tools/utils/dsnDownload.js';

const logger = createLogger('memory-resurrector');

interface Memory {
  cid: string;
  previousCid: string | null;
  content: any;
}

class MemoryResurrector {
  private memories: Map<string, Memory> = new Map();
  private failedCids: Set<string> = new Set();

  private async fetchMemoryChain(currentCid: string): Promise<void> {
    if (!currentCid || this.memories.has(currentCid) || this.failedCids.has(currentCid)) {
      return;
    }

    try {
      const content = await downloadCharacter(currentCid);

      const memory: Memory = {
        cid: currentCid,
        previousCid: content.previousCid || null,
        content
      };
      
      this.memories.set(currentCid, memory);
      logger.info(`Successfully fetched memory ${currentCid}`);

      if (memory.previousCid) {
        await this.fetchMemoryChain(memory.previousCid);
      }

    } catch (error) {
      logger.error(`Failed to fetch memory ${currentCid}:`, error);
      this.failedCids.add(currentCid);
    }
  }

  async resurrect(startCid: string): Promise<Map<string, Memory>> {
    await this.fetchMemoryChain(startCid);
    return this.memories;
  }

  async downloadAllMemories(): Promise<Memory[]> {
    const latestCid = await getLastMemoryCid();
    if (!latestCid) {
      logger.info('No memories found (empty CID)');
      return [];
    }
    
    await this.resurrect(latestCid);
    
    const memories = Array.from(this.memories.values());
    logger.info(`Downloaded ${memories.length} memories, failed CIDs: ${this.failedCids.size}`);
    
    return memories;
  }
}

export default MemoryResurrector;