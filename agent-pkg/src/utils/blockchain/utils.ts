import { cidFromBlakeHash, cidToString } from '@autonomys/auto-dag-data';
import { blake3HashFromCid, stringToCid } from '@autonomys/auto-dag-data';
import { ethers, hexlify } from 'ethers';
import { initializeConfigAndCredentials } from '../../config/index.js';
import chalk from 'chalk';

export const getWalletAddress = async (): Promise<string> => {
    try {
        const { config, credentials } = await initializeConfigAndCredentials();
        const rpcUrl = config.taurusRpcUrl;
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        let privateKey: string | undefined;
    
        if (credentials.autoEvmPrivateKey) {
        privateKey = credentials.autoEvmPrivateKey;
        } else {
        console.log(
            chalk.yellow('Private key not found. Blockchain operation requires authentication.'),
        );
        }

        if (!privateKey) {
        throw new Error('Auto-EVM private key is required for this operation');
        }
    
        const wallet = new ethers.Wallet(privateKey, provider);
        return wallet.getAddress();
        } catch (error) {
            console.error('Error getting wallet address:', error);
            throw error;
        }
}

export const getCidFromHash = (hash: string): string => {
    const hashBuffer = Buffer.from(hash.slice(2), 'hex');
    const cid = cidFromBlakeHash(hashBuffer);
    return cidToString(cid);
  };

export const getHashFromCid = (cid: string): string => {
    const blake3hash = blake3HashFromCid(stringToCid(cid));
    return hexlify(blake3hash);
  };
