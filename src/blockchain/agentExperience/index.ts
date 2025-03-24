import { AutoDriveApi, createAutoDriveApi, uploadObjectAsJSON } from '@autonomys/auto-drive';
import { ExperienceHeader, ExperienceManagerOptions, ExperienceUploadOptions } from './types.js';
import { ethers } from 'ethers';
import { createCidManager } from './cidManager.js';

const uploadExperience = async (
  autoDriveApi: AutoDriveApi,
  wallet: ethers.Wallet,
  header: ExperienceHeader,
  data: unknown,
  { compression, password }: ExperienceUploadOptions,
) => {
  const fileName = `${header.agentName}-agent-${header.agentVersion}-memory-${header.timestamp}.json`;

  const signature = await wallet.signMessage(JSON.stringify({ header, data }));
  const cid = await uploadObjectAsJSON(autoDriveApi, { header, data, signature }, fileName, {
    compression,
    password,
  });
  return cid;
};

export const createExperienceManager = async ({
  autoDriveApiOptions,
  uploadOptions,
  walletOptions,
  agentOptions,
}: ExperienceManagerOptions) => {
  const autoDriveApi = createAutoDriveApi(autoDriveApiOptions);
  const provider = new ethers.JsonRpcProvider(walletOptions.rpcUrl);
  const wallet = new ethers.Wallet(walletOptions.privateKey, provider);
  const cidManager = await createCidManager(agentOptions.agentPath, walletOptions);

  const saveExperience = async (data: unknown) => {
    const previousCid = await cidManager.getLastMemoryCid();
    const header = {
      agentVersion: agentOptions.agentVersion,
      agentName: agentOptions.agentName,
      timestamp: new Date().toISOString(),
      previousCid,
    };
    const cid = await uploadExperience(autoDriveApi, wallet, header, data, uploadOptions);
    const receipt = await cidManager.saveLastMemoryCid(cid);
    return {
      cid,
      previousCid: previousCid || null,
      evmHash: receipt.hash,
    };
  };

  return { saveExperience };
};
