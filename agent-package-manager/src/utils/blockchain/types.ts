// Define a Version interface to match the contract's Version struct
interface Version {
  major: number;
  minor: number;
  patch: number;
}
// Define a custom error type for handling contract errors
interface ContractError extends Error {
  reason?: string;
  code?: string;
  message: string;
  data?: string; // Contains the error selector for custom errors
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

// Map of error selectors to error names
// These would need to be calculated from the contract's custom error signatures
// using ethers.id("VersionAlreadyExists()").slice(0, 10)
const ERROR_SELECTORS: { [selector: string]: string } = {
  '0x13db702b': 'VersionAlreadyExists',
  '0xf5360597': 'ToolNameAlreadyRegistered',
  '0xc75851c9': 'InvalidVersionOrder',
  '0x3b9a80b5': 'Tool does not exist',
  '0xccf472af': 'VersionNotExists',
  '0x64283d7b': 'NotToolOwner',
};

// Utility function to extract the actual error from a contract error
function getCustomErrorFromData(error: ContractError): string | null {
  // Check various places where the error selector might be stored
  const dataFields = [error.data, error.info?.error?.data];

  for (const data of dataFields) {
    if (!data) continue;

    // Check if this selector is in our map
    if (ERROR_SELECTORS[data]) {
      return ERROR_SELECTORS[data];
    }
  }

  return null;
}

// Check if error is of a specific type
function isCustomError(error: ContractError, errorType: string): boolean {
  const customError = getCustomErrorFromData(error);

  if (customError === errorType) {
    return true;
  }

  // Also check traditional error fields
  if (
    error.reason?.includes(errorType) ||
    error.message?.includes(errorType) ||
    error.shortMessage?.includes(errorType)
  ) {
    return true;
  }

  return false;
}

export {
  Version,
  ContractError,
  ToolInfo,
  ToolVersionInfo,
  ToolLatestVersionInfo,
  ERROR_SELECTORS,
  getCustomErrorFromData,
  isCustomError,
};
