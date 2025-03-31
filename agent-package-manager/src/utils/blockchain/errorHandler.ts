import { ContractError, ContractErrorType } from './types.js';

/**
 * Map of error selectors to error types
 * These are calculated using ethers.id("ErrorName()").slice(0, 10)
 * Some values are confirmed from runtime observations and may differ from calculated values
 */
const ERROR_SELECTORS: { [selector: string]: ContractErrorType } = {
  // Access control errors
  '0x5fc483c5': ContractErrorType.OnlyOwner,
  '0x1ab03ccf': ContractErrorType.NotToolOwner,

  // Tool registration errors
  '0x9e6ecbe8': ContractErrorType.ToolNameAlreadyRegistered,
  '0x13db702b': ContractErrorType.VersionAlreadyExists,
  '0x3c302a34': ContractErrorType.InvalidVersionOrder,

  // Lookup errors
  '0x809e7c46': ContractErrorType.ToolNotFound,
  '0x905a219b': ContractErrorType.VersionNotExists,

  // Validation errors
  '0x3b4db0f0': ContractErrorType.EmptyToolName,
  '0xa9146eeb': ContractErrorType.InvalidVersion,
  '0x46d6031a': ContractErrorType.EmptyCidHash,
  '0x04cfa015': ContractErrorType.EmptyMetadataHash,
  '0x8579befe': ContractErrorType.ZeroAddressNotAllowed,
  '0x2a63c7cc': ContractErrorType.SameOwner,
  '0x9605a010': ContractErrorType.OffsetOutOfBounds,
  '0xb13c0a6c': ContractErrorType.InvalidNameHash,
};

/**
 * Extract the error type from a contract error
 * @param error The contract error object
 * @returns The identified error type or null if not recognized
 */
const getErrorType = (error: ContractError): ContractErrorType | null => {
  // Add debug logging for unknown error selectors
  if (
    (error.data || error.info?.error?.data) &&
    !ERROR_SELECTORS[error.data || ''] &&
    !ERROR_SELECTORS[error.info?.error?.data || '']
  ) {
    console.debug('Unrecognized error selector detected:', {
      data: error.data,
      infoData: error.info?.error?.data,
      errorMessage: error.message,
      shortMessage: error.shortMessage,
      reason: error.reason,
    });
  }

  const dataFields = [error.data, error.info?.error?.data];

  for (const data of dataFields) {
    if (data && ERROR_SELECTORS[data]) {
      return ERROR_SELECTORS[data];
    }
  }

  // For any selector that isn't mapped but is detected, return UnknownError
  if (error.data || error.info?.error?.data) {
    return ContractErrorType.UnknownError;
  }

  return null;
};

export { getErrorType, ERROR_SELECTORS };
