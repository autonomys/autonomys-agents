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

// Setup dependencies in dist folder by symlinking
const setupDistDependencies = async (): Promise<void> => {
  try {
    // Get paths
    const distDir = path.join(rootDir, 'dist');
    const coreNodeModulesPath = path.join(rootDir, 'core', 'node_modules');
    const distNodeModulesPath = path.join(distDir, 'node_modules');
    
    // Create a symlink from core/node_modules to dist/node_modules if it doesn't exist
    if (!existsSync(distNodeModulesPath)) {
      console.log('Setting up symlink to core node_modules...');
      
      if (process.platform === 'win32') {
        // Windows needs directory junction
        await execAsync(`mklink /J "${distNodeModulesPath}" "${coreNodeModulesPath}"`);
      } else {
        // Unix/Mac can use symlink
        await fs.symlink(coreNodeModulesPath, distNodeModulesPath, 'dir');
      }
      
      console.log('Symlink created successfully');
    } else {
      console.log('Dependencies symlink already exists, skipping');
    }
  } catch (error) {
    console.error(
      `Error setting up dist dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    // Create dist directory if it doesn't exist
    const distDir = path.join(rootDir, 'dist');
    if (!existsSync(distDir)) {
      console.log('Creating dist directory...');
      await fs.mkdir(distDir, { recursive: true });
    }

    // Check if we need to build
    const indexJsPath = path.join(distDir, 'src', 'index.js');
    if (!existsSync(indexJsPath)) {
      // Run build using workspace to ensure it runs in the context of the core package
      console.log('Building the project...');
      await execAsync('yarn workspace autonomys-agents-core build');
      
      // Verify the build succeeded
      if (!existsSync(indexJsPath)) {
        console.error('Build failed: index.js not found in dist directory');
        process.exit(1);
      }
    } else {
      console.log('Build exists, skipping build step');
    }
    
    // Setup dist dependencies
    await setupDistDependencies();

    // Use path to dist at the root level
    const distPath = path.join(rootDir, 'dist', 'src', 'index.js');

    const nodeArgs = [distPath, characterName];
    if (isHeadless) {
      nodeArgs.push('--headless');
    }

    // Run the main program with all arguments
    const mainProcess = spawn('node', nodeArgs, { 
      stdio: 'inherit',
      cwd: path.join(rootDir, 'dist') // Set working directory to dist
    });

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
