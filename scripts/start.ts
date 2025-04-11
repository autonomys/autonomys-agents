import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { rootDir } from './utils';

const execAsync = promisify(exec);

const start = async () => {
  const characterName = process.argv[2];
  const isHeadless = process.argv[3] === '--headless';

  if (!characterName) {
    console.error('Please provide a character name');
    console.error('Usage: yarn start <character-name> [--headless]');
    process.exit(1);
  }

  try {
    // Update path to dist directory (now inside core folder)
    const distDir = path.join(rootDir, 'core', 'dist');
    
    // Check if we need to build
    const indexJsPath = path.join(distDir, 'index.js');
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

    // Use updated path to index.js inside core/dist
    const distPath = path.join(distDir, 'index.js');

    const nodeArgs = [distPath, characterName];
    if (isHeadless) {
      nodeArgs.push('--headless');
    }

    // Run the main program with all arguments
    const mainProcess = spawn('node', nodeArgs, { 
      stdio: 'inherit',
      cwd: distDir // Set working directory to core/dist
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
