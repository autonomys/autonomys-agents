import { Contract } from 'ethers';
import { config } from '../../../config/index.js';
import { createLogger } from '../../../utils/logger.js';
import { FAUCET_ABI } from './abi/faucet.js';
import { wallet } from './agentWallet.js';

const logger = createLogger('faucet-tool');
const FAUCET_CONTRACT_ADDRESS = '0x2296dbb90C714c1355Ff9cbcB70D5AB29060b454';

interface FaucetRequestData {
  address: string;
}

export async function requestTokens(address: string) {
  logger.info('Sending faucet request - Starting requestTokens');

  if (!config.blockchainConfig.PRIVATE_KEY) {
    logger.error('Private key is not set');
    return;
  }

  try {
    const faucet = new Contract(FAUCET_CONTRACT_ADDRESS, FAUCET_ABI, wallet);

    const tx = await faucet.requestTokens(address);

    logger.info('Faucet request transaction submitted', {
      txHash: tx.hash,
    });

    return {
      message: 'Success',
      txHash: tx.hash,
    };
  } catch (error) {
    logger.error('Error requesting tokens:', error);
    throw error;
  }
}
