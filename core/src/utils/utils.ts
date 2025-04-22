import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root
export const getProjectRoot = () => {
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
