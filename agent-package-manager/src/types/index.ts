// TODO - It would be nice to have each type in its own file

export interface InstallOptions {
  cid?: string;
  version?: string;
  local?: boolean;
}

export interface InitOptions {
  install?: boolean;
  character?: string;
  api?: boolean;
}

export interface ToolInstallInfo {
  name: string;
  cid: string;
  version?: string;
}

export interface ToolCommandParams {
  name: string;
  version?: string;
  action?: string;
}

export interface ToolMetadata {
  name: string;
  version: string;
  author: string;
  cid: string;
  metadataCid: string;
  updated: string;
}

export interface PublishedToolMetadata {
  name: string;
  version: string;
  author: string;
  cid: string;
  updated: string;
  dependencies: Record<string, string>;
}

export interface ToolRegistry {
  version: string;
  updated: string;
  tools: Record<string, ToolMetadata>;
}

export interface ToolManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: Record<string, string>;
  main: string;
  keywords: string[];
}

// Command result types
export interface CommandResult {
  success: boolean;
  message: string;
  data?: object;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface Credentials {
  autoDriveApiKey?: string;
  autoDriveEncryptionPassword?: string;
  autoEvmPrivateKey?: string;
}

export interface PasswordCache {
  password: string;
  timestamp: number;
}

export interface CleanOptions {
  force?: boolean;
}

export interface ConfigOptions {
  credentials?: boolean;
  settings?: boolean;
}

export interface PublishOptions {
  registry?: boolean;
}

export interface ToolMetadataOptions {
  version?: string;
}

export interface Config {
  autoDriveApiKey?: string;
  autoDriveEncryptionPassword?: string;
  autoEvmPrivateKey?: string;
  packageRegistryAddress?: string;
  taurusRpcUrl?: string;
  indexerUrl?: string;
}
