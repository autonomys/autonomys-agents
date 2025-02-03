import { ethers, Contract } from 'ethers';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';
import { cidFromBlakeHash } from '@autonomys/auto-dag-data';
import { createLogger } from './logger.js';

const logger = createLogger('agentMemoryContract');

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;
const RECONNECT_DELAY = 5000;

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
  private readonly HEALTH_CHECK_INTERVAL = 30000;

  constructor(
    private readonly agentAddress: string,
    private readonly agentName: string,
    private readonly processMemory: (agent: string, cid: string) => Promise<void>,
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
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 5000);
        });
        
        const healthCheckPromise = this.contract.getLastMemoryHash(this.agentAddress);
        
        await Promise.race([healthCheckPromise, timeoutPromise]);
        logger.info(`Health check passed for agent ${this.agentName}`);
      } catch (error) {
        logger.warn(`Health check failed for agent ${this.agentName}, reconnecting...`, {
          error: error instanceof Error ? error.message : String(error)
        });
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

    // Cap the retry count to prevent excessive delays while still maintaining exponential backoff
    const MAX_RETRY_COUNT = 10;
    const currentRetryCount = Math.min(this.retryCount, MAX_RETRY_COUNT);
    const delay = Math.min(
      RECONNECT_DELAY * Math.pow(2, currentRetryCount),
      60000 // Max 1 minute delay
    );
    
    this.retryCount++;

    logger.info(`Attempting to reconnect for agent ${this.agentName} (attempt ${this.retryCount}, delay: ${delay}ms)`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.stop();
        
        // Clear any existing state
        if (this.healthCheckInterval) {
          clearInterval(this.healthCheckInterval);
          this.healthCheckInterval = undefined;
        }
        
        // Reinitialize everything
        await this.initializeConnection();
        await this.start();
        
        this.retryCount = 0; // Reset retry count on successful reconnection
        logger.info(`Successfully reconnected for agent ${this.agentName}`);
      } catch (error) {
        logger.error(`Reconnection failed for agent ${this.agentName}:`, error);
        // Ensure we're in a clean state before trying again
        await this.stop().catch(stopError => 
          logger.error(`Error stopping during reconnection for ${this.agentName}:`, stopError)
        );
        this.reconnect(); // Schedule next reconnection attempt
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
            logger.error(
              `Failed to process memory after ${this.MAX_PROCESSING_RETRIES} attempts, dropping`,
              {
                agent: this.agentName,
                error,
              },
            );
            this.processingQueue.splice(i, 1);
            i--;
          } else {
            item.nextRetry = new Date(
              now.getTime() + this.RETRY_DELAY * Math.pow(2, item.retryCount),
            );
            logger.warn(`Failed to process memory, will retry later`, {
              agent: this.agentName,
              retryCount: item.retryCount,
              nextRetry: item.nextRetry,
              error,
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
            retryCount: 0,
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
  callback: (agent: string, cid: string) => Promise<void>,
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
