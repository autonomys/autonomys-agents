import fs from 'fs/promises';
import path from 'path';
import { ToolManifest, ValidationResult } from '../types/index.js';


/**
 * Validates a tool structure to ensure it follows the required format
 * @param toolPath Path to the tool directory
 * @returns ValidationResult indicating if the tool structure is valid
 */
export const validateToolStructure = async (toolPath: string): Promise<ValidationResult> => {
  try {
    // Check if directory exists
    try {
      const stats = await fs.stat(toolPath);
      if (!stats.isDirectory()) {
        return { valid: false, message: `${toolPath} is not a directory` };
      }
    } catch (error) {
      return { valid: false, message: `Directory ${toolPath} does not exist` };
    }

    // Check for manifest.json
    const manifestPath = path.join(toolPath, 'manifest.json');
    try {
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      let manifest: ToolManifest;

      try {
        manifest = JSON.parse(manifestData) as ToolManifest;
      } catch (parseError) {
        return { valid: false, message: 'manifest.json contains invalid JSON' };
      }

      // Validate manifest fields
      const requiredFields: (keyof ToolManifest)[] = [
        'name',
        'version',
        'description',
        'author',
        'main',
      ];

      for (const field of requiredFields) {
        if (!manifest[field]) {
          return { valid: false, message: `manifest.json is missing required field: ${field}` };
        }
      }

      // Check main file exists
      const mainFilePath = path.join(toolPath, manifest.main);
      try {
        await fs.access(mainFilePath);
      } catch (mainError) {
        return { valid: false, message: `Main file ${manifest.main} does not exist` };
      }

      // Validate tool follows LangChain DynamicStructuredTool pattern
      // TODO: Add more sophisticated validation of tool structure

      return { valid: true };
    } catch (manifestError) {
      return { valid: false, message: 'manifest.json is missing' };
    }
  } catch (error) {
    return {
      valid: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
