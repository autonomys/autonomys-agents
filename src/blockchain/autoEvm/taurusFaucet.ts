import { Contract } from 'ethers';
import { createLogger } from '../../utils/logger.js';
import { FAUCET_ABI } from '../abi/faucet.js';
import { wallet } from './agentWallet.js';

const logger = createLogger('faucet-tools');
const FAUCET_CONTRACT_ADDRESS = '0x2296dbb90C714c1355Ff9cbcB70D5AB29060b454';

type FaucetLockTimeResult = {
  lockTime: BigInt;
};

type FaucetNextAccessTimeResult = {
  nextAccessTime: BigInt;
};

type FaucetIsMinterResult = {
  isMinter: boolean;
};

type FaucetWithdrawalAmountResult = {
  withdrawalAmount: BigInt;
};

type FaucetRequestResult = {
  success: boolean;
  txHash: string | null;
  message: string;
};

const getFaucetContract = () => {
  return new Contract(FAUCET_CONTRACT_ADDRESS, FAUCET_ABI, wallet);
};

export const lockTime = async (): Promise<FaucetLockTimeResult> => {
  try {
    const faucet = getFaucetContract();
    const lockTime = await faucet.lockTime();
    return { lockTime };
  } catch (error) {
    logger.error('Error calling lockTime:', error);
    throw error;
  }
};

export const nextAccessTime = async (address: string): Promise<FaucetNextAccessTimeResult> => {
  try {
    const faucet = getFaucetContract();
    const nextAccessTime = await faucet.nextAccessTime(address);
    return { nextAccessTime };
  } catch (error) {
    logger.error('Error calling nextAccessTime:', error);
    throw error;
  }
};

export const isMinter = async (address: string): Promise<FaucetIsMinterResult> => {
  try {
    const faucet = getFaucetContract();
    const isMinter = await faucet.isMinter(address);
    return { isMinter };
  } catch (error) {
    logger.error('Error calling isMinter:', error);
    throw error;
  }
};

export const withdrawalAmount = async (): Promise<FaucetWithdrawalAmountResult> => {
  try {
    const faucet = getFaucetContract();
    const withdrawalAmount = await faucet.withdrawalAmount();
    return { withdrawalAmount };
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
