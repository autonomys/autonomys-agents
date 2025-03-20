import { cidFromBlakeHash, cidToString } from '@autonomys/auto-dag-data';
import { blake3HashFromCid, stringToCid } from '@autonomys/auto-dag-data';
import { ethers, hexlify } from 'ethers';
import { loadCredentials } from '../credential/index.js';
import chalk from 'chalk';

export const getWalletAddress = async (): Promise<string> => {
    const credentials = await loadCredentials();

    let privateKey: string | undefined;

    if (credentials.autoEvmPrivateKey) {
        privateKey = credentials.autoEvmPrivateKey;
        const wallet = new ethers.Wallet(privateKey);
        return wallet.getAddress();
    } else {
    console.log(
        chalk.yellow('Private key not found. Blockchain operation requires authentication.'),
    );
    }
    throw new Error('Auto-EVM private key is required for this operation');
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
