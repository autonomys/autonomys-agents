import path from 'path';
import fs from 'fs/promises';

/**
 * The user's home directory
 */
export const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '';

/**
 * Root directory for all autoOS files
 */
export const AUTOOS_DIR = path.join(HOME_DIR, '.autoOS');

export const PACKAGES_DIR = path.join(AUTOOS_DIR, 'packages');
export const TOOLS_DIR = path.join(AUTOOS_DIR, 'tools');

export const DEFAULT_PROJECT_TOOLS_PATH = 'src/agents/tools';

export const REGISTRY_CACHE_PATH = path.join(AUTOOS_DIR, 'registry.json');

export const CONFIG_FILE = path.join(AUTOOS_DIR, 'config.json');
export const CREDENTIALS_FILE = path.join(AUTOOS_DIR, 'credentials.enc');

export const ensureAutoOSDir = async () => {
  try {
    await fs.access(AUTOOS_DIR);
  } catch (error) {
    console.error('Error ensuring autoOS directory:', error);
    await fs.mkdir(AUTOOS_DIR, { recursive: true });
  }
};

/**
 * Detects the root directory of the current project
 * @returns Path to the project root or undefined if not found
 */
export const detectProjectRoot = async (): Promise<string | undefined> => {
  let currentDir = process.cwd();

  while (currentDir && currentDir !== HOME_DIR && currentDir !== path.parse(currentDir).root) {
    try {
      const files = await fs.readdir(currentDir);
      if (
        files.includes('package.json') ||
        files.includes('tsconfig.json') ||
        files.includes('.git')
      ) {
        return currentDir;
      }

      currentDir = path.dirname(currentDir);
    } catch (error) {
      console.error('Error detecting project root:', error);
      currentDir = path.dirname(currentDir);
    }
  }

  return undefined;
};

/**
 * Determines the installation directory for a tool
 * @param isLocalInstall Whether to install locally or globally
 * @returns Object containing the installation directory and type
 * @throws Error if project root cannot be detected for local installation
 */
export const getToolInstallDir = async (
  isLocalInstall: boolean,
): Promise<{ installDir: string }> => {
  if (isLocalInstall) {
    const projectRoot = await detectProjectRoot();
    if (!projectRoot) {
      throw new Error('Could not detect project root. Make sure you are in a project directory.');
    }
    return {
      installDir: path.join(projectRoot, DEFAULT_PROJECT_TOOLS_PATH),
    };
  }

  return {
    installDir: TOOLS_DIR,
  };
};
