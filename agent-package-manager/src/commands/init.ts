import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { CommandResult, InitOptions } from '../types/index.js';

/**
 * Download file from URL to specified path
 */
const downloadFile = async (url: string, destinationPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl: string, redirectCount = 0) => {
      // Prevent infinite redirect loops
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      // Parse the URL to determine if it's http or https
      const urlObj = new URL(requestUrl);
      const httpModule = urlObj.protocol === 'https:' ? https : require('http');

      const request = httpModule.get(requestUrl, async (response: http.IncomingMessage) => {
        // Handle redirects (status codes 301, 302, 303, 307, 308)
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          // Close current request
          request.destroy();

          // Follow the redirect
          makeRequest(response.headers.location, redirectCount + 1);
          return;
        }

        if (!response.statusCode || response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        try {
          const fileStream = createWriteStream(destinationPath);
          await pipeline(response, fileStream);
          resolve();
        } catch (err) {
          fs.unlink(destinationPath).catch(() => {});
          reject(err);
        }
      });

      request.on('error', (err: Error) => {
        fs.unlink(destinationPath).catch(() => {});
        reject(err);
      });
    };

    // Start the request
    makeRequest(url);
  });
};

/**
 * Extract a zip file using unzipper (implemented with Node.js streams)
 */
const extractZip = async (zipPath: string, destinationDir: string): Promise<void> => {
  // Since we're avoiding external dependencies, we'll use the unzip command if available
  // This is not a pure JS solution but should work on most systems
  const { exec } = await import('child_process');

  return new Promise((resolve, reject) => {
    exec(`unzip -o "${zipPath}" -d "${destinationDir}"`, (error, _stdout, _stderr) => {
      if (error) {
        console.error(`Extraction error: ${error.message}`);
        console.error(`Attempting alternative extraction method...`);

        // If unzip fails, fall back to a less efficient but more compatible method
        try {
          const { extract } = require('node:tar');
          extract({ file: zipPath, cwd: destinationDir }).then(resolve).catch(reject);
        } catch (fallbackError) {
          console.error(
            `Failed to extract using both methods. Please install 'unzip' command line tool or use a system with tar support.`,
            fallbackError,
          );
          reject(
            new Error(
              `Failed to extract using both methods. Please install 'unzip' command line tool or use a system with tar support.`,
            ),
          );
        }
        return;
      }
      resolve();
    });
  });
};

/**
 * Download and extract the template repository
 */
const downloadTemplate = async (
  projectPath: string,
  spinner: ReturnType<typeof ora>,
): Promise<void> => {
  spinner.text = 'Downloading template repository...';

  try {
    // Create temporary directory for the zip file
    const tempDir = path.join(os.tmpdir(), `autonomys-template-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    const tempZipPath = path.join(tempDir, 'template.zip');

    // Download the zip file
    spinner.text = 'Downloading template from GitHub...';
    const templateUrl =
      'https://github.com/autonomys/autonomys-agent-template/archive/refs/heads/main.zip';
    await downloadFile(templateUrl, tempZipPath);

    // Extract the zip file
    spinner.text = 'Extracting template...';
    const extractDir = path.join(tempDir, 'extracted');
    await fs.mkdir(extractDir, { recursive: true });
    await extractZip(tempZipPath, extractDir);

    // Find the extracted directory name (should be autonomys-agent-template-main)
    const extractedItems = await fs.readdir(extractDir);
    const templateDirName = extractedItems.find(item =>
      item.startsWith('autonomys-agent-template'),
    );

    if (!templateDirName) {
      throw new Error('Could not find extracted template directory');
    }

    // Copy files from the extracted directory to the project path
    spinner.text = 'Copying template files...';
    const templateDir = path.join(extractDir, templateDirName);

    // Copy recursively
    const copyRecursive = async (src: string, dest: string) => {
      const entries = await fs.readdir(src, { withFileTypes: true });

      await fs.mkdir(dest, { recursive: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await copyRecursive(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    };

    await copyRecursive(templateDir, projectPath);

    // Clean up
    spinner.text = 'Cleaning up...';
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    throw new Error(
      `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Update template files with custom project name
 */
const customizeTemplate = async (
  projectPath: string,
  packageName: string,
  spinner: ReturnType<typeof ora>,
): Promise<void> => {
  try {
    spinner.text = 'Customizing template for your project...';

    // Update package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    let packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');

    // Parse and update package.json
    const packageJson = JSON.parse(packageJsonContent);
    packageJson.name = packageName;
    const description = `${packageName} agent project`;
    packageJson.description = description;

    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Update README.md
    const readmePath = path.join(projectPath, 'README.md');
    let readmeContent = await fs.readFile(readmePath, 'utf8');

    // Replace the first h1 heading with the project name
    readmeContent = readmeContent.replace(/^# .*$/m, `# ${packageName}`);

    // Add description
    readmeContent = readmeContent.replace(/^# .*$/m, `# ${packageName}\n\n${description}`);

    await fs.writeFile(readmePath, readmeContent);
  } catch (error) {
    throw new Error(
      `Failed to customize template: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

// Add a function to run a command and log the output
const runCommand = async (
  command: string,
  cwd: string,
  _spinner: ReturnType<typeof ora>,
): Promise<void> => {
  const { exec } = await import('child_process');

  return new Promise((resolve, reject) => {
    const childProcess = exec(command, { cwd }, (error, _stdout, _stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });

    // Stream output to console
    childProcess.stdout?.pipe(process.stdout);
    childProcess.stderr?.pipe(process.stderr);
  });
};

/**
 * Initialize a new agent project
 */
const init = async (projectName: string, options: InitOptions): Promise<CommandResult> => {
  const spinner = ora(`Creating new agent project: ${projectName}...`).start();

  try {
    // Determine project path
    const projectPath = path.resolve(process.cwd(), projectName);

    // Check if directory already exists
    try {
      await fs.access(projectPath);
      spinner.fail(`Directory already exists: ${projectPath}`);
      return {
        success: false,
        message: `Directory already exists: ${projectPath}`,
      };
    } catch {}

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Generate package name from project name
    const packageName = projectName.toLowerCase().replace(/\s+/g, '-');

    // Download template repository
    try {
      await downloadTemplate(projectPath, spinner);
    } catch (error) {
      spinner.fail(
        `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Clean up the project directory if it was created
      await fs.rm(projectPath, { recursive: true, force: true }).catch(() => {});

      return {
        success: false,
        message: `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Customize template files with project-specific information
    await customizeTemplate(projectPath, packageName, spinner);

    spinner.succeed(`Created agent project in ${projectName}`);

    // Handle automated next steps if requested
    if (options.install) {
      spinner.start('Installing dependencies...');
      try {
        await runCommand('yarn install', projectPath, spinner);
        spinner.succeed('Dependencies installed');

        // If install succeeds and a character name is provided, create the character
        if (options.character) {
          spinner.start(`Creating character: ${options.character}...`);
          try {
            await runCommand(`yarn create-character ${options.character}`, projectPath, spinner);
            spinner.succeed(`Character "${options.character}" created`);
          } catch (characterError) {
            spinner.fail(
              `Failed to create character: ${characterError instanceof Error ? characterError.message : String(characterError)}`,
            );
          }
        }

        // If install succeeds and api flag is provided, generate certificates
        if (options.api) {
          spinner.start('Generating API certificates...');
          try {
            await runCommand('yarn generate-certs', projectPath, spinner);
            spinner.succeed('API certificates generated');
          } catch (certsError) {
            spinner.fail(
              `Failed to generate certificates: ${certsError instanceof Error ? certsError.message : String(certsError)}`,
            );
          }
        }
      } catch (installError) {
        spinner.fail(
          `Failed to install dependencies: ${installError instanceof Error ? installError.message : String(installError)}`,
        );
      }
    }

    // Print next steps (skip steps that were already executed)
    console.log(`\n${chalk.green('Next steps:')}`);
    console.log(chalk.cyan(`  cd ${projectName}`));

    if (!options.install) {
      console.log(chalk.cyan('  yarn install'));
    }

    if (!options.character) {
      console.log(chalk.cyan('  yarn create-character your-character-name'));
      console.log(
        chalk.cyan('  # Configure your character in characters/your-character-name/config/'),
      );
    } else {
      console.log(
        chalk.cyan(`  # Configure your character in characters/${options.character}/config/`),
      );
      console.log(chalk.cyan(`    - Edit .env with your API keys and credentials`));
      console.log(chalk.cyan(`    - Customize config.yaml for agent behavior`));
      console.log(chalk.cyan(`    - Adjust ${options.character}.yaml for personality settings`));
      if (!options.api) {
        console.log(chalk.cyan(`  yarn generate-certs`));
      }
      console.log(chalk.cyan(`  yarn start ${options.character} --workspace=/path/to/workspace`));
    }

    // Suggest flags for next time
    if (!options.install || !options.character || !options.api) {
      console.log(`\n${chalk.yellow('Pro tip:')} Next time, use these flags for a faster setup:`);
      let command = `  autoOS init ${projectName} --install`;
      if (!options.character) command += ' --character=your-character-name';
      if (!options.api) command += ' --api';
      console.log(chalk.cyan(command));
    }

    return {
      success: true,
      message: `Successfully created agent project in ${projectName}`,
    };
  } catch (error) {
    spinner.fail(`Failed to create agent project: ${projectName}`);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(errorMessage));

    return {
      success: false,
      message: `Failed to create agent project: ${errorMessage}`,
    };
  }
};

export { init };
