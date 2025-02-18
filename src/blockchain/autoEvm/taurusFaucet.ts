import { Contract } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { FAUCET_ABI } from '../abi/faucet.js';
import { provider, wallet } from './agentWallet.js';

const logger = createLogger('faucet-tools');
const FAUCET_CONTRACT_ADDRESS = '0x2296dbb90C714c1355Ff9cbcB70D5AB29060b454';

type FaucetRequestResult = {
  success: boolean;
  txHash: string | null;
  message: string;
};

const getFaucetContract = () => {
  return new Contract(FAUCET_CONTRACT_ADDRESS, FAUCET_ABI, wallet);
};

export const verifyFaucetBalance = async (): Promise<bigint> => {
  try {
    const balance = await provider.getBalance(FAUCET_CONTRACT_ADDRESS);
    return BigInt(balance.toString());
  } catch (error) {
    logger.error('Error calling verifyFaucetBalance:', error);
    throw error;
  }
};

export const nextAccessTime = async (address: string): Promise<bigint> => {
  try {
    const faucet = getFaucetContract();
    const nextAccessTime = await faucet.nextAccessTime(address);
    return BigInt(nextAccessTime.toString());
  } catch (error) {
    logger.error('Error calling nextAccessTime:', error);
    throw error;
  }
};

export const isMinter = async (): Promise<boolean> => {
  try {
    const faucet = getFaucetContract();
    const isMinter = await faucet.isMinter(wallet.address);
    return Boolean(isMinter);
  } catch (error) {
    logger.error('Error calling isMinter:', error);
    throw error;
  }
};

export const withdrawalAmount = async (): Promise<bigint> => {
  try {
    const faucet = getFaucetContract();
    const withdrawalAmount = await faucet.withdrawalAmount();
    return BigInt(withdrawalAmount.toString());
  } catch (error) {
    logger.error('Error calling withdrawalAmount:', error);
    throw error;
  }
};

export const requestTokens = async (address: string): Promise<FaucetRequestResult> => {
  logger.info('Sending faucet request - Starting requestTokens');
  try {
    const faucet = getFaucetContract();
    const tx = await faucet.requestTokens(address);
    logger.info('Faucet request transaction submitted', {
      success: true,
      txHash: tx.hash,
    });
    return {
      success: true,
      txHash: tx.hash,
      message: 'Success',
    };
  } catch (error) {
    logger.error('Error requesting tokens:', error);
    return {
      success: false,
      txHash: null,
      message: 'Error requesting tokens',
    };
  }
};
