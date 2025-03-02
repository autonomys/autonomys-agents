import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { CommandResult } from '../types/index.js';
import { updateRegistry } from '../utils/registry.js';
import { validateToolStructure } from '../utils/validation.js';
import { packageAndUploadTool } from '../utils/packageAndUpload.js';

export async function publish(toolPath: string, options: any = {}): Promise<CommandResult> {
  const spinner = ora(`Publishing tool from ${toolPath}...`).start();
  
  try {
    // 1. Validate the tool structure
    const validationResult = await validateToolStructure(toolPath);
    
    if (!validationResult.valid) {
      spinner.fail(`Invalid tool structure: ${validationResult.message}`);
      return { success: false, message: `Invalid tool structure: ${validationResult.message}` };
    }
    
    // 2. Package and upload the tool
    spinner.text = 'Packaging and uploading tool...';
    const { cid, metadata } = await packageAndUploadTool(toolPath);
    
    // 3. Update the registry (unless skipped)
    if (options.registry !== false) {
      spinner.text = 'Updating registry...';
      await updateRegistry(metadata);
      spinner.succeed(`Successfully published ${metadata.name}`);
      console.log(chalk.green(`\nTool published with CID: ${cid}`));
    } else {
      spinner.succeed(`Successfully uploaded ${metadata.name} to DSN (skipped registry update)`);
      console.log(chalk.green(`\nTool uploaded with CID: ${cid}`));
      console.log(chalk.yellow(`\nFor direct installation use:`));
      console.log(`autoOS install ${metadata.name} --cid ${cid}`);
    }
    
    return { 
      success: true, 
      message: options.registry !== false ? `Successfully published ${metadata.name}` : `Successfully uploaded ${metadata.name} to DSN`,
      data: { cid, metadata }
    };
  } catch (error) {
    spinner.fail(`Failed to publish tool`);
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    return { success: false, message: `Failed to publish tool: ${error}` };
  }
} 