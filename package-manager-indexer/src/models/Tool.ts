import { ethers } from 'ethers';
import { cidFromBlakeHash, cidToString } from '@autonomys/auto-dag-data';

export interface Tool {
  id: number;
  name: string;
  nameHash: Buffer;
  ownerAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolVersion {
  id: number;
  toolId: number;
  major: number;
  minor: number;
  patch: number;
  cid: string;
  metadataCid: string;
  publisherAddress: string;
  publishedAt: Date;
  createdAt: Date;
}

export interface ToolWithVersions extends Tool {
  versions: ToolVersion[];
}

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

// Utility to convert string name to Buffer hash
export const nameToHash = (name: string): Buffer => {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(name));
  return Buffer.from(hash.slice(2), 'hex');
};

// Utility to convert bytes32 hash to Buffer
export const bytes32ToBuffer = (bytes32: string): Buffer => {
  // Remove '0x' if present
  const hex = bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32;
  return Buffer.from(hex, 'hex');
};

// Utility to convert bytes32 hash to CID string
export const hashToCid = (bytes32: string | Buffer): string => {
  // If it's a string, convert to Buffer
  const hashBuffer = Buffer.isBuffer(bytes32) ? bytes32 : bytes32ToBuffer(bytes32);

  // Convert hash to CID
  const cid = cidFromBlakeHash(hashBuffer);
  return cidToString(cid);
};
