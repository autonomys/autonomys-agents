export interface InstallOptions {
  cid?: string;
  version?: string;
  local?: boolean;
}

export interface ToolInstallInfo {
  name: string;
  cid: string;
  version?: string;
}

// Tool Registry Types
export interface ToolMetadata {
  name: string;
  version: string;
  author: string;
  cid: string;
  metadataCid: string;
  updated: string;
}

export interface ToolRegistry {
  version: string;
  updated: string;
  tools: Record<string, ToolMetadata>;
}

// Tool Manifest Type (for individual tools)
export interface ToolManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  main: string; // Main entry file
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

export interface Config {
  autoDriveApiKey?: string;
  autoDriveEncryptionPassword?: string;
  autoEvmPrivateKey?: string;
  packageRegistryAddress?: string;
  taurusRpcUrl?: string;
}
