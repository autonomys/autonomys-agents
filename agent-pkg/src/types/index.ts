// Tool Registry Types
export interface ToolMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  cid: string;
  updated: string;
}

export interface ToolRegistry {
  version: string;
  updated: string;
  previousRegistryCid?: string;
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
  data?: any;
} 