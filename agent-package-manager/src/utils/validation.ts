import fs from 'fs/promises';
import path from 'path';
import { ToolManifest, ValidationResult } from '../types/index.js';

const validateToolStructure = async (toolPath: string): Promise<ValidationResult> => {
  try {
    try {
      const stats = await fs.stat(toolPath);
      if (!stats.isDirectory()) {
        return { valid: false, message: `${toolPath} is not a directory` };
      }
    } catch (error) {
      console.error(`Error checking if directory exists: ${error}`);
      return { valid: false, message: `Directory ${toolPath} does not exist` };
    }

    const manifestPath = path.join(toolPath, 'manifest.json');
    try {
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      let manifest: ToolManifest;

      try {
        manifest = JSON.parse(manifestData) as ToolManifest;
      } catch (parseError) {
        console.error(`Error parsing manifest.json: ${parseError}`);
        return { valid: false, message: 'manifest.json contains invalid JSON' };
      }

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

      const mainFilePath = path.join(toolPath, manifest.main);
      try {
        await fs.access(mainFilePath);
      } catch (mainError) {
        console.error(`Error checking if main file exists: ${mainError}`);
        return { valid: false, message: `Main file ${manifest.main} does not exist` };
      }

      // Validate tool follows LangChain DynamicStructuredTool pattern
      // TODO: Add more sophisticated validation of tool structure

      return { valid: true };
    } catch (manifestError) {
      console.error(`Error validating manifest.json: ${manifestError}`);
      return { valid: false, message: 'manifest.json is missing' };
    }
  } catch (error) {
    return {
      valid: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export { validateToolStructure };
