import { ethers, Contract } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { createLogger } from './logger.js';

const logger = createLogger('agentMemoryContract');

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;
const RECONNECT_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;

class AgentWatcher {
  private provider!: ethers.WebSocketProvider;
  private contract!: Contract;
  private isWatching: boolean = false;
  private retryCount: number = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private processingQueue: Array<{
    agent: string;
    hash: string;
    retryCount: number;
    nextRetry?: Date;
  }> = [];
  private isProcessing: boolean = false;
  private readonly MAX_PROCESSING_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(
    private readonly agentAddress: string,
    private readonly agentName: string,
    private readonly processMemory: (agent: string, cid: string) => Promise<void>
  ) {
    this.initializeConnection();
  }

  private async initializeConnection() {
    this.provider = new ethers.WebSocketProvider(config.WS_RPC_URL);
    const wallet = ethers.Wallet.createRandom(this.provider);
    this.contract = new Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);
    
    this.provider.websocket.onerror = this.handleConnectionError.bind(this);
    this.startHealthCheck();
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        // Test connection by making a simple call
        logger.info(`Health check for agent ${this.agentName}`);
        await this.contract.getLastMemoryHash(this.agentAddress);
      } catch (error) {
        logger.warn(`Health check failed for agent ${this.agentName}, reconnecting...`);
        this.handleConnectionError(error as Error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private handleConnectionError(error: Error): void {
    logger.error(`WebSocket error for agent ${this.agentName}:`, error);
    this.reconnect();
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Even if max retries reached, keep trying with longer delays
    const delay = RECONNECT_DELAY * Math.pow(2, Math.min(this.retryCount, 6)); // Cap exponential growth
    this.retryCount++;

    logger.info(`Attempting to reconnect for agent ${this.agentName} (attempt ${this.retryCount})`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.stop();
        await this.initializeConnection();
        await this.start();
        this.retryCount = 0; // Reset retry count on successful reconnection
        logger.info(`Successfully reconnected for agent ${this.agentName}`);
      } catch (error) {
        logger.error(`Reconnection failed for agent ${this.agentName}:`, error);
        this.reconnect(); // Always try to reconnect
      }
    }, delay);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    const now = new Date();
    
    try {
      for (let i = 0; i < this.processingQueue.length; i++) {
        const item = this.processingQueue[i];
        
        if (item.nextRetry && item.nextRetry > now) {
          continue;
        }

        try {
          const cid = hashToCid(ethers.getBytes(item.hash));
          await this.processMemory(item.agent, cid);
          this.processingQueue.splice(i, 1);
          i--;
          logger.info(`Processed memory for agent ${this.agentName}`, { cid });
        } catch (error) {
          item.retryCount++;
          if (item.retryCount >= this.MAX_PROCESSING_RETRIES) {
            logger.error(`Failed to process memory after ${this.MAX_PROCESSING_RETRIES} attempts, dropping`, {
              agent: this.agentName,
              error
            });
            this.processingQueue.splice(i, 1);
            i--;
          } else {
            item.nextRetry = new Date(now.getTime() + this.RETRY_DELAY * Math.pow(2, item.retryCount));
            logger.warn(`Failed to process memory, will retry later`, {
              agent: this.agentName,
              retryCount: item.retryCount,
              nextRetry: item.nextRetry,
              error
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.processingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  async start(): Promise<void> {
    if (this.isWatching) return;

    try {
      const eventName = 'LastMemoryHashSet';
      
      const listener = (agent: string, hash: string) => {
        if (agent.toLowerCase() === this.agentAddress.toLowerCase()) {
          this.processingQueue.push({
            agent,
            hash,
            retryCount: 0
          });
          this.processQueue();
        }
      };

      this.contract.on(eventName, listener);
      this.isWatching = true;
      logger.info(`Started watching memory updates for agent ${this.agentName}`);
    } catch (error) {
      logger.error(`Failed to start watcher for agent ${this.agentName}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (!this.isWatching) return;

    try {
      this.contract.removeAllListeners();
      await this.provider.destroy();
      this.isWatching = false;
      logger.info(`Stopped watching memory updates for agent ${this.agentName}`);
    } catch (error) {
      logger.error(`Error stopping watcher for agent ${this.agentName}:`, error);
    }
  }
}

function hashToCid(hash: Uint8Array): string {
  const cid = cidFromBlakeHash(Buffer.from(hash));
  return cid.toString();
}

export async function watchMemoryHashUpdates(
  callback: (agent: string, cid: string) => Promise<void>
): Promise<() => Promise<void>> {
  const watchers = new Map<string, AgentWatcher>();

  // Create a watcher for each agent
  for (const agent of config.AGENTS) {
    const watcher = new AgentWatcher(agent.address, agent.username, callback);
    await watcher.start();
    watchers.set(agent.address, watcher);
  }

  // Return cleanup function
  return async () => {
    for (const watcher of watchers.values()) {
      await watcher.stop();
    }
    watchers.clear();
    logger.info('All memory watchers stopped');
  };
}

export async function getLastMemoryHash(agentAddress: string): Promise<string> {
  const provider = new ethers.WebSocketProvider(config.WS_RPC_URL);
  const wallet = ethers.Wallet.createRandom(provider);
  const contract = new Contract(CONTRACT_ADDRESS, MEMORY_ABI, wallet);

  try {
    const hash = await contract.getLastMemoryHash(agentAddress);
    return hashToCid(ethers.getBytes(hash));
  } finally {
    await provider.destroy();
  }
}
