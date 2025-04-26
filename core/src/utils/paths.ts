import path from 'path';
import fs from 'fs';

// Get the absolute path to the project root - no dependencies on other modules
export const getProjectRoot = (): { root: string } | undefined => {
  let currentDir = process.cwd();

  while (currentDir && currentDir !== path.parse(currentDir).root) {
    try {
      const files = fs.readdirSync(currentDir);
      if (files.includes('package.json') || files.includes('tsconfig.json')) {
        return {
          root: currentDir,
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

/**
 * Get the workspace path based on command line or environment settings
 */
export const getWorkspacePath = (): string => {
  // First check args
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace' && i + 1 < args.length) {
      return args[i + 1];
    }
  }

  // Then try project root
  const projectRoot = getProjectRoot();
  return projectRoot?.root || process.cwd();
};
