import chalk from 'chalk';
import ora from 'ora';
import { CommandResult, PublishOptions } from '../types/index.js';
import { updateRegistry } from '../utils/commands/registry/updateRegistry.js';
import { validateToolStructure } from '../utils/validation.js';
import { packageAndUploadTool } from '../utils/commands/registry/toolPublish.js';
import { credentialsExist } from '../utils/credential/index.js';

const publish = async (toolPath: string, options: PublishOptions): Promise<CommandResult> => {
  const spinner = ora(`Publishing tool from ${toolPath}...`).start();

  try {
    // Early check for credentials
    const hasCredentials = await credentialsExist();
    if (!hasCredentials) {
      spinner.fail('Missing credentials required for publishing');
      console.log(chalk.yellow('\nPublishing requires credentials to be set up.'));
      console.log(chalk.yellow('Please run ') + chalk.cyan('autoOS config --credentials') + chalk.yellow(' to set up your credentials.'));
      return { 
        success: false, 
        message: 'Missing credentials required for publishing. Run "autoOS config --credentials" to set up.' 
      };
    }

    const validationResult = await validateToolStructure(toolPath);

    if (!validationResult.valid) {
      spinner.fail(`Invalid tool structure: ${validationResult.message}`);
      return { success: false, message: `Invalid tool structure: ${validationResult.message}` };
    }

    spinner.text = 'Packaging and uploading tool...';
    const { cid, metadataCid, metadata } = await packageAndUploadTool(toolPath);

    if (options.registry !== false) {
      spinner.text = 'Updating registry...';
      const { txHash, error } = await updateRegistry(metadata, metadataCid);
      if (error) {
        spinner.fail(`Failed to update registry: ${error}`);
        return { success: false, message: `Failed to update registry: ${error}` };
      }
      spinner.succeed(`Successfully published ${metadata.name}, txHash: ${txHash}`);
      console.log(chalk.green(`\nTool published with CID: ${cid}`));
    } else {
      spinner.succeed(`Successfully uploaded ${metadata.name} to DSN (skipped registry update)`);
      console.log(chalk.green(`\nTool uploaded with CID: ${cid}`));
      console.log(chalk.yellow(`\nFor direct installation use:`));
      console.log(`autoOS install ${metadata.name} --cid ${cid}`);
    }

    return {
      success: true,
      message:
        options.registry !== false
          ? `Successfully published ${metadata.name}`
          : `Successfully uploaded ${metadata.name} to DSN`,
      data: { cid, metadata },
    };
  } catch (error) {
    spinner.fail(`Failed to publish tool`);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(errorMessage));
    return { success: false, message: `Failed to publish tool: ${errorMessage}` };
  }
};

export { publish };
