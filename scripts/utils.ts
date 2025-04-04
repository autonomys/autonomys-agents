import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to find the package.json
const findRootDir = (startDir: string): string => {
  let currentDir = startDir;
  
  // Keep going up until we find package.json with the right name
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.name === 'autonomys-agents') {
          return currentDir;
        }
      } catch (e) {
        // Continue if package.json exists but can't be parsed
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  throw new Error('Could not find project root directory');
}

export const rootDir = findRootDir(__dirname);
