// Define a Version interface to match the contract's Version struct
interface Version {
  major: number;
  minor: number;
  patch: number;
}

// Define a custom error type for handling contract errors
interface ContractError extends Error {
  reason?: string;
  code?: string; // Contains the error selector for custom errors
  message: string;
  data?: string;
  shortMessage?: string;
  info?: {
    error?: {
      code: number;
      message: string;
      data: string; // Error selector
    };
  };
}

interface ToolInfo {
  owner: string;
  versionCount: number;
  latestVersion: string;
}

interface ToolVersionInfo {
  cid: string;
  timestamp: number;
  metadataCid: string;
}

interface ToolLatestVersionInfo extends ToolVersionInfo {
  version: string;
}

/**
 * Error types that can be returned by the contract
 * Ordered to match the structure of the smart contract
 */
enum ContractErrorType {
  // Access control errors
  OnlyOwner = 'OnlyOwner',
  NotToolOwner = 'NotToolOwner',

  // Tool registration errors
  ToolNameAlreadyRegistered = 'ToolNameAlreadyRegistered',
  VersionAlreadyExists = 'VersionAlreadyExists',
  InvalidVersionOrder = 'InvalidVersionOrder',

  // Lookup errors
  ToolNotFound = 'ToolNotFound',
  VersionNotExists = 'VersionNotExists',

  // Validation errors
  EmptyToolName = 'EmptyToolName',
  InvalidVersion = 'InvalidVersion',
  EmptyCidHash = 'EmptyCidHash',
  EmptyMetadataHash = 'EmptyMetadataHash',
  ZeroAddressNotAllowed = 'ZeroAddressNotAllowed',
  SameOwner = 'SameOwner',
  OffsetOutOfBounds = 'OffsetOutOfBounds',
  InvalidNameHash = 'InvalidNameHash',

  // Special case
  UnknownError = 'UnknownError',
}

export {
  Version,
  ContractError,
  ToolInfo,
  ToolVersionInfo,
  ToolLatestVersionInfo,
  ContractErrorType,
};
