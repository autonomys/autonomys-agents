import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { CommandResult, InitOptions } from '../types/index.js';
import { customizeTemplate, downloadTemplate, runCommand } from '../utils/commands/init/index.js';

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
    const _createProjectDir = await fs.mkdir(projectPath, { recursive: true });

    // Generate package name from project name
    const packageName = projectName.toLowerCase().replace(/\s+/g, '-');

    // Download template repository
    try {
      const _downloadTemplate = await downloadTemplate(projectPath, spinner);
    } catch (error) {
      spinner.fail(
        `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Clean up the project directory if it was created
      const _rmProjectDir = await fs
        .rm(projectPath, { recursive: true, force: true })
        .catch(() => {});

      return {
        success: false,
        message: `Failed to download template: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Customize template files with project-specific information
    const _customizeTemplate = await customizeTemplate(projectPath, packageName, spinner);

    spinner.succeed(`Created agent project in ${projectName}`);

    // Handle automated next steps if requested
    if (options.install) {
      spinner.start('Installing dependencies...');
      try {
        const _installDependencies = await runCommand('yarn install', projectPath, spinner);
        spinner.succeed('Dependencies installed');

        // If install succeeds and a character name is provided, create the character
        if (options.character) {
          spinner.start(`Creating character: ${options.character}...`);
          try {
            const _createCharacter = await runCommand(
              `yarn create-character ${options.character}`,
              projectPath,
              spinner,
            );
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
            const _generateCerts = await runCommand('yarn generate-certs', projectPath, spinner);
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

    // Add information about installing tools
    console.log(chalk.green(`\nInstalling agent tools:`));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  autoOS install <tool-name>`));
    console.log(chalk.cyan(`  # Tools will be installed to src/tools/ in your project`));

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
