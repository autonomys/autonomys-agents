import { ethers } from 'ethers';

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
  cidHash: Buffer;
  metadataHash: Buffer;
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