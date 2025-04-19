import fs from 'fs/promises';
import path from 'path';
import { ToolManifest, ValidationResult } from '../types/index.js';

/**
 * Validates if a string is a valid npm package name
 * Based on npm naming rules: https://github.com/npm/validate-npm-package-name
 */
const isValidPackageName = (name: string): boolean => {
  // Basic validation for npm package names
  if (!name) return false;
  if (name.startsWith('.')) return false;
  if (name.startsWith('_')) return false;
  if (name.trim() !== name) return false;
  if (name.length > 214) return false;

  // Package names can't have uppercase letters
  if (name.toLowerCase() !== name) return false;

  // Package names can only contain URL-friendly characters
  const validRegex = /^[a-z0-9-._~@!$&'()*+,;=:/]+$/;
  if (!validRegex.test(name)) return false;

  return true;
};

/**
 * Validates if a string is a valid npm package version
 * Based on semver specification
 */
const isValidVersionSpecifier = (version: string): boolean => {
  if (!version || typeof version !== 'string') return false;

  // Allow wildcards
  if (version === '*' || version === 'latest') return true;

  // Exact versions (1.2.3)
  if (/^\d+\.\d+\.\d+$/.test(version)) return true;

  // Semver ranges with ^ or ~ (^1.2.3, ~1.2.3)
  if (/^[\^~]\d+\.\d+\.\d+$/.test(version)) return true;

  // Version ranges with comparison operators
  if (/^(>=|<=|>|<)\d+\.\d+\.\d+$/.test(version)) return true;

  // Version ranges (1.2.3 - 1.5.0)
  if (/^\d+\.\d+\.\d+ - \d+\.\d+\.\d+$/.test(version)) return true;

  // Git URLs
  if (/^(git|http|https|git\+https|git\+ssh):\/\//.test(version)) return true;

  // GitHub URLs
  if (/^(github|gitlab|bitbucket):/.test(version)) return true;
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/.test(version)) return true;

  // Local paths
  if (/^file:/.test(version)) return true;

  return false;
};

/**
 * Validates dependencies in the tool manifest
 */
const validateDependencies = (dependencies: Record<string, string>): ValidationResult => {
  if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) {
    return {
      valid: false,
      message: 'dependencies must be an object mapping package names to versions',
    };
  }

  for (const [pkg, version] of Object.entries(dependencies)) {
    if (!isValidPackageName(pkg)) {
      return {
        valid: false,
        message: `dependency name '${pkg}' is not a valid npm package name`,
      };
    }

    if (!isValidVersionSpecifier(version)) {
      return {
        valid: false,
        message: `version '${version}' for package '${pkg}' is not a valid version specifier`,
      };
    }
  }

  return { valid: true };
};

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

      // Validate dependencies if present
      if (manifest.dependencies && Object.keys(manifest.dependencies).length > 0) {
        const dependenciesValidation = validateDependencies(manifest.dependencies);
        if (!dependenciesValidation.valid) {
          return dependenciesValidation;
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

export { validateToolStructure, validateDependencies, isValidPackageName, isValidVersionSpecifier };
