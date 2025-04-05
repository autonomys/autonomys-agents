import { AutoDriveApi, createAutoDriveApi } from '@autonomys/auto-drive';
import {
  AgentExperience,
  ExperienceHeader,
  ExperienceManager,
  ExperienceManagerOptions,
  ExperienceUploadOptions,
} from './types.js';
import { ethers } from 'ethers';
import { createCidManager } from './cidManager.js';
import { retryWithBackoff } from '../../utils/retry.js';

const uploadExperience = async (
  autoDriveApi: AutoDriveApi,
  wallet: ethers.Wallet,
  header: ExperienceHeader,
  data: unknown,
  { compression, password }: ExperienceUploadOptions,
) => {
  const fileName = `${header.agentName}-agent-${header.agentVersion}-memory-${header.timestamp}.json`;

  const signature = await wallet.signMessage(JSON.stringify({ header, data }));
  const cid = await autoDriveApi.uploadObjectAsJSON({ header, data, signature }, fileName, {
    compression,
    password,
  });
  return cid;
};

const downloadExperience = async (
  autoDriveApi: AutoDriveApi,
  cid: string,
): Promise<AgentExperience> => {
  const stream = await autoDriveApi.downloadFile(cid);
  let file = Buffer.alloc(0);
  for await (const chunk of stream) {
    file = Buffer.concat([file, chunk]);
  }

  const jsonString = new TextDecoder().decode(file);
  const data = JSON.parse(jsonString);
  return data;
};

export const createExperienceManager = async ({
  autoDriveApiOptions,
  uploadOptions,
  walletOptions,
  agentOptions,
}: ExperienceManagerOptions): Promise<ExperienceManager> => {
  const autoDriveApi = createAutoDriveApi(autoDriveApiOptions);
  const wallet = new ethers.Wallet(walletOptions.privateKey);
  const cidManager = await createCidManager(agentOptions.agentPath, walletOptions);

  const saveExperience = async (data: unknown) => {
    const previousCid = await cidManager.getLastMemoryCid();
    const header = {
      agentVersion: agentOptions.agentVersion || 'unknown',
      agentName: agentOptions.agentName,
      timestamp: new Date().toISOString(),
      previousCid,
    };
    const cid = await uploadExperience(autoDriveApi, wallet, header, data, uploadOptions);
    const receipt = await cidManager.saveLastMemoryCid(cid);
    return {
      cid,
      previousCid: previousCid || null,
      evmHash: receipt?.hash || null,
    };
  };

  const retrieveExperience = async (cid: string) => {
    return retryWithBackoff(
      async () => {
        const experience = await downloadExperience(autoDriveApi, cid);
        return experience;
      },
      {
        shouldRetry: error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return !(
            errorMessage.includes('Not Found') || errorMessage.includes('incorrect header check')
          );
        },
      },
    );
  };

  return { saveExperience, retrieveExperience, cidManager };
};
