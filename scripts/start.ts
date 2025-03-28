import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

import fs from 'fs/promises';
import path from 'path';

const copyCharacterFile = async (characterName: string): Promise<void> => {
  if (!characterName || characterName.startsWith('-')) {
    console.error('Error: No character name provided');
    process.exit(1);
  }

  const sourceDir = path.join('characters', characterName, 'config');
  const destDir = path.join('dist', 'characters', characterName, 'config');
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
    // Run build
    await execAsync('yarn build');

    // Run copy-character script
    await copyCharacterFile(characterName);

    const nodeArgs = ['dist/index.js', characterName];
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
