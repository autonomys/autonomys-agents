import { config } from '../../src/config/index.js';
import { createLogger } from '../../src/utils/logger.js';
import { validateLocalHash } from '../../src/blockchain/localHashStorage.js';
import {
  createOrchestratorRunner,
  OrchestratorRunner,
} from '../../src/agents/workflows/orchestrator/orchestratorWorkflow.js';
import { createPrompts } from '../../src/agents/workflows/orchestrator/prompts.js';
import { HumanMessage } from '@langchain/core/messages';
import { OrchestratorRunnerOptions } from '../../src/agents/workflows/orchestrator/types.js';
import { ethers } from 'ethers';
import {
  createCheckBalanceTool,
  createTransferNativeTokenTool,
} from '../../src/agents/tools/evm/index.js';

const logger = createLogger('autonomous-web3-agent');

const character = config.characterConfig;
const orchestratorConfig = async (): Promise<OrchestratorRunnerOptions> => {
  // Check for RPC and private key in config
  if (!config.blockchainConfig.PRIVATE_KEY || !config.blockchainConfig.RPC_URL) {
    throw new Error('PRIVATE_KEY and RPC_URL are required in the blockchainConfig');
  }

  // Set up provider and signer
  const provider = new ethers.JsonRpcProvider(config.blockchainConfig.RPC_URL);
  const signer = new ethers.Wallet(config.blockchainConfig.PRIVATE_KEY, provider);

  // Create tools
  const transferNativeTokenTool = createTransferNativeTokenTool(signer);
  const checkBalanceTool = createCheckBalanceTool(provider);

  //Orchestrator config
  //use default orchestrator prompts with character config
  const prompts = await createPrompts(character);

  return {
    tools: [transferNativeTokenTool, checkBalanceTool],
    prompts,
  };
};

const orchestrationConfig = await orchestratorConfig();
export const orchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return async () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(character, orchestrationConfig);
    }
    return runnerPromise;
  };
})();

const main = async () => {
  const runner = await orchestratorRunner();

  // Choose which message to start with
  const initialMessage = `Transfer 0.01 AI3 to 0x0F409152C9cDA318c3dB94c0693c1347E29E1Ea8 and then check the balance of both sender and receiver`;

  try {
    await validateLocalHash();

    const result = await runner.runWorkflow({ messages: [new HumanMessage(initialMessage)] });

    logger.info('Workflow execution result:', { summary: result.summary });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
      logger.info('Process terminated by user');
      process.exit(0);
    }
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

main();
