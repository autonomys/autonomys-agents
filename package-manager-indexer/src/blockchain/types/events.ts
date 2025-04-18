// Event interface definitions for blockchain events

export interface ToolRegisteredEvent {
  name: string;
  major: number;
  minor: number;
  patch: number;
  cidHash: string;
  metadataHash: string;
  publisher: string;
  timestamp: Date;
  blockNumber: number;
  transactionHash: string;
}

export interface ToolUpdatedEvent {
  name: string;
  major: number;
  minor: number;
  patch: number;
  cidHash: string;
  metadataHash: string;
  publisher: string;
  timestamp: Date;
  blockNumber: number;
  transactionHash: string;
}

export interface OwnershipTransferredEvent {
  name: string;
  previousOwner: string;
  newOwner: string;
  blockNumber: number;
  transactionHash: string;
}

export interface EventCallbacks {
  onToolRegistered: (event: ToolRegisteredEvent) => Promise<void>;
  onToolUpdated: (event: ToolUpdatedEvent) => Promise<void>;
  onOwnershipTransferred: (event: OwnershipTransferredEvent) => Promise<void>;
  onProcessedBlock: (blockNumber: number) => Promise<void>;
} 