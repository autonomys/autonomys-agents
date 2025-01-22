import { ethers } from 'ethers';
import { config } from '../../../../config/index.js';

export const provider = new ethers.JsonRpcProvider(config.blockchainConfig.RPC_URL);

export const wallet = new ethers.Wallet(config.blockchainConfig.PRIVATE_KEY as string, provider);

export async function signMessage(data: object): Promise<string> {
  const message = JSON.stringify(data);
  return await wallet.signMessage(message);
}
