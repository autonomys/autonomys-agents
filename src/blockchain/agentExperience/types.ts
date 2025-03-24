export type ExperienceHeader = {
  agentVersion: string;
  //TODO: when we have an identity scheme update to use an identifier for the agent
  agentName: string;
  timestamp: string;
  previousCid: string;
};

export type AgentExperience = {
  header: ExperienceHeader;
  data: unknown;
  signature: string;
};

export type StoredHash = {
  hash: string;
  timestamp: string;
};

export type AutoDriveApiOptions = {
  apiKey: string;
  network: 'taurus' | 'mainnet';
};

export type ExperienceUploadOptions = {
  compression: boolean;
  password?: string;
};

export type EvmOptions = {
  privateKey: string;
  rpcUrl: string;
  contractAddress: string;
};

export type AgentOptions = {
  agentVersion: string;
  agentName: string;
  agentPath: string;
};

export type ExperienceManagerOptions = {
  autoDriveApiOptions: AutoDriveApiOptions;
  uploadOptions: ExperienceUploadOptions;
  walletOptions: EvmOptions;
  agentOptions: AgentOptions;
};

export type ExperienceManager = {
  saveExperience: (data: unknown) => Promise<{
    cid: string;
    previousCid: string | null;
    evmHash: string;
  }>;
};
