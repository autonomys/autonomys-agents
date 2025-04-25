import path from 'path';
import fs from 'fs/promises';

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '';
const AGENTOS_DIR = path.join(HOME_DIR, '.agent-os');
const PACKAGES_DIR = path.join(AGENTOS_DIR, 'packages');
const DEFAULT_PROJECT_TOOLS_PATH = 'src/tools';
const REGISTRY_CACHE_PATH = path.join(AGENTOS_DIR, 'registry.json');
const CONFIG_FILE = path.join(AGENTOS_DIR, 'config.json');
const CREDENTIALS_FILE = path.join(AGENTOS_DIR, 'credentials.enc');

const ensureAgentOSDir = async () => {
  try {
    try {
      await fs.access(AGENTOS_DIR);
    } catch {
      // Directory doesn't exist, create it
      console.log(`Creating directory: ${AGENTOS_DIR}`);
      const _createAgentOSDir = await fs.mkdir(AGENTOS_DIR, { recursive: true });
    }
    try {
      await fs.access(PACKAGES_DIR);
    } catch {
      // Packages directory doesn't exist, create it
      console.log(`Creating directory: ${PACKAGES_DIR}`);
      const _createPackagesDir = await fs.mkdir(PACKAGES_DIR, { recursive: true });
    }

    return true;
  } catch (error) {
    console.error('Error creating agent-os directories:', error);
    throw new Error(
      `Failed to create required directories: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const detectProjectRoot = async (): Promise<
  { root: string; isTemplateProject: boolean } | undefined
> => {
  let currentDir = process.cwd();

  while (currentDir && currentDir !== HOME_DIR && currentDir !== path.parse(currentDir).root) {
    try {
      const files = await fs.readdir(currentDir);
      if (
        files.includes('package.json') ||
        files.includes('tsconfig.json') ||
        files.includes('.git')
      ) {
        // Check if this is an autonomys-agent-template based project
        let isTemplateProject = false;
        try {
          const packageJsonPath = path.join(currentDir, 'package.json');
          const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(packageJsonContent);

          // Check for key dependencies that would indicate this is our template
          if (packageJson.dependencies && packageJson.dependencies['@autonomys/agent-core']) {
            if (files.includes('src')) {
              const srcFiles = await fs.readdir(path.join(currentDir, 'src'));
              if (srcFiles.includes('tools') || srcFiles.includes('index.ts')) {
                isTemplateProject = true;
              }
            }
          }
        } catch {
          // If we can't read package.json, assume it's not a template project
        }

        return {
          root: currentDir,
          isTemplateProject,
        };
      }

      currentDir = path.dirname(currentDir);
    } catch (error) {
      console.error('Error detecting project root:', error);
      currentDir = path.dirname(currentDir);
    }
  }

  return undefined;
};

const getToolInstallDir = async (): Promise<{ installDir: string | undefined }> => {
  // Always use local installation regardless of the isLocalInstall flag
  const projectInfo = await detectProjectRoot();
  if (!projectInfo) {
    throw new Error('Could not detect project root. Make sure you are in a project directory.');
  }

  const { root, isTemplateProject } = projectInfo;

  // If this is a template project, use the template directory structure
  if (isTemplateProject) {
    const toolsDir = path.join(root, 'src', 'tools');
    // Ensure the directory exists
    await fs.mkdir(toolsDir, { recursive: true });
    return {
      installDir: toolsDir,
    };
  }

  return {
    installDir: undefined,
  };
};

export {
  HOME_DIR,
  AGENTOS_DIR,
  PACKAGES_DIR,
  DEFAULT_PROJECT_TOOLS_PATH,
  REGISTRY_CACHE_PATH,
  CONFIG_FILE,
  CREDENTIALS_FILE,
  ensureAgentOSDir,
  getToolInstallDir,
};
