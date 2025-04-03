import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to find the package.json
function findRootDir(startDir: string): string {
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

const rootDir = findRootDir(__dirname);

const copyCharacterFile = async (characterName: string): Promise<void> => {
  if (!characterName || characterName.startsWith('-')) {
    console.error('Error: No character name provided');
    process.exit(1);
  }

  const sourceDir = path.join(rootDir, 'characters', characterName, 'config');
  const destDir = path.join(rootDir, 'core', 'dist', 'characters', characterName, 'config');
  const fileName = `${characterName}.yaml`;

  try {
    // Create destination directory
    await fs.mkdir(destDir, { recursive: true });

    // Copy the file
    await fs.copyFile(path.join(sourceDir, fileName), path.join(destDir, fileName));
  } catch (error) {
    console.error(
      `Error copying character file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    process.exit(1);
  }
};

const start = async () => {
  const characterName = process.argv[2];
  const isHeadless = process.argv[3] === '--headless';

  if (!characterName) {
    console.error('Please provide a character name');
    console.error('Usage: yarn start <character-name> [--headless]');
    process.exit(1);
  }

  try {
    // Run build using workspace to ensure it runs in the context of the core package
    await execAsync('yarn workspace autonomys-agents-core build');

    // Run copy-character script
    await copyCharacterFile(characterName);

    // Use path to dist inside the core folder
    const distPath = path.join(rootDir, 'core', 'dist', 'index.js');
    
    const nodeArgs = [distPath, characterName];
    if (isHeadless) {
      nodeArgs.push('--headless');
    }

    // Run the main program with all arguments
    const mainProcess = spawn('node', nodeArgs, { stdio: 'inherit' });

    mainProcess.on('error', err => {
      console.error('Failed to start main process:', err);
      process.exit(1);
    });

    mainProcess.on('exit', code => {
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

start();
