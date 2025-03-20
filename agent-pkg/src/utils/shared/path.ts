import path from 'path';
import fs from 'fs/promises';


 const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '';
 const AUTOOS_DIR = path.join(HOME_DIR, '.autoOS');
 const PACKAGES_DIR = path.join(AUTOOS_DIR, 'packages');
 const TOOLS_DIR = path.join(AUTOOS_DIR, 'tools');
 const DEFAULT_PROJECT_TOOLS_PATH = 'src/agents/tools';
 const REGISTRY_CACHE_PATH = path.join(AUTOOS_DIR, 'registry.json');
 const CONFIG_FILE = path.join(AUTOOS_DIR, 'config.json');
 const CREDENTIALS_FILE = path.join(AUTOOS_DIR, 'credentials.enc');

 const ensureAutoOSDir = async () => {
  try {
    await fs.access(AUTOOS_DIR);
  } catch (error) {
    console.error('Error ensuring autoOS directory:', error);
    await fs.mkdir(AUTOOS_DIR, { recursive: true });
  }
};


 const detectProjectRoot = async (): Promise<string | undefined> => {
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


 const getToolInstallDir = async (
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

export {
  HOME_DIR,
  AUTOOS_DIR,
  PACKAGES_DIR,
  TOOLS_DIR,
  DEFAULT_PROJECT_TOOLS_PATH,
  REGISTRY_CACHE_PATH,
  CONFIG_FILE,
  CREDENTIALS_FILE,
  ensureAutoOSDir,
  getToolInstallDir,
}
