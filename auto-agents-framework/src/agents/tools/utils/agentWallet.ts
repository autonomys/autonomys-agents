import { ethers } from 'ethers';
import { config } from '../../../config/index.js';

const provider = new ethers.JsonRpcProvider(config.autoDriveConfig.RPC_URL);

export const wallet = new ethers.Wallet(config.autoDriveConfig.PRIVATE_KEY as string, provider);

export async function signMessage(data: object): Promise<string> {
  const message = JSON.stringify(data);
  return await wallet.signMessage(message);
}
