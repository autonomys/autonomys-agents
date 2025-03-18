import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import { CommandResult } from '../types/index.js';
import { getToolFromRegistry, getToolVersionFromRegistry } from '../utils/registry.js';
import { downloadFileFromDsn } from '../utils/autoDriveClient.js';
import {
  PACKAGES_DIR,
  getToolInstallDir
} from '../utils/path.js';
import { InstallOptions, ToolInstallInfo } from '../types/index.js';


/**
 * Downloads a tool package from Autonomys DSN to the local cache
 * @param cid Content identifier for the tool package
 * @returns Path to the downloaded package file
 */
async function fetchToolPackage(cid: string): Promise<string> {
  await fs.mkdir(PACKAGES_DIR, { recursive: true });
  const packagePath = path.join(PACKAGES_DIR, `${cid}.zip`);

  try {
    console.log(`Downloading tool package with CID: ${cid}`);
    const fileStream = await downloadFileFromDsn(cid, process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD);

    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }

    const fileData = Buffer.concat(chunks);
    await fs.writeFile(packagePath, fileData);

    console.log(`Tool package downloaded to: ${packagePath}`);
    return packagePath;
  } catch (error) {
    console.error('Error downloading package:', error);
    throw error;
  }
}

/**
 * Extracts a zip package to the target installation directory
 * @param packagePath Path to the downloaded package file
 * @param toolName Name of the tool
 * @param targetDir Target directory for installation
 * @returns Path to the extracted tool directory
 */
async function unpackToolToDirectory(
  packagePath: string,
  toolName: string,
  targetDir: string,
): Promise<string> {
  const toolDir = path.join(targetDir, toolName);
  await fs.mkdir(toolDir, { recursive: true });

  try {
    console.log(`Extracting package to: ${toolDir}`);
    await extract(packagePath, { dir: toolDir });
    return toolDir;
  } catch (error) {
    console.error('Error extracting package:', error);
    throw error;
  }
}

/**
 * Executes the complete tool installation process
 * @param toolInfo Tool metadata for installation
 * @param isLocalInstall Whether to install locally
 * @returns Path to the installed tool directory
 */
async function performToolInstallation(
  toolInfo: ToolInstallInfo,
  isLocalInstall: boolean
): Promise<string> {
  try {
    const packagePath = await fetchToolPackage(toolInfo.cid);   
    const { installDir } = await getToolInstallDir(isLocalInstall);
    const toolDir = await unpackToolToDirectory(packagePath, toolInfo.name, installDir);
    console.log(`Tool installed successfully to: ${toolDir}`);
    return toolDir;
  } catch (error) {
    console.error('Failed to install tool:', error);
    throw error;
  }
}

/**
 * Resolves tool information from different sources (CID, version, latest)
 * @param toolName Name of the tool to install
 * @param options Installation options
 * @param spinner Progress spinner for UI updates
 * @returns Tool information and descriptive version text
 */
async function resolveToolInfo(
  toolName: string,
  options: InstallOptions,
  spinner: ReturnType<typeof ora>
): Promise<{ toolInfo: ToolInstallInfo; versionText: string }> {
  const installType = options.local ? 'locally' : 'globally';
  let versionText = '';
  
  // Determine installation source
  if (options.cid) {
    // Direct CID installation
    if (!options.cid) {
      throw new Error('CID is required when installing a tool by CID');
    }
    
    spinner.text = `Installing ${toolName} ${installType} using CID: ${options.cid}`;
    return {
      toolInfo: {
        name: toolName,
        cid: options.cid
      },
      versionText: ''
    };
  } 
  else if (options.version) {
    // Specific version installation
    if (!options.version) {
      throw new Error('Version is required when installing a specific version');
    }
    
    versionText = `version ${options.version}`;
    spinner.text = `Looking for ${toolName} ${versionText}...`;
    
    const registryToolInfo = await getToolVersionFromRegistry(toolName, options.version);
    if (!registryToolInfo) {
      throw new Error(`${versionText} of tool '${toolName}' not found in registry. Use 'autoOS list -d' to see available versions.`);
    }
    
    spinner.text = `Installing ${toolName} ${versionText} ${installType} from registry...`;
    return {
      toolInfo: {
        name: registryToolInfo.name,
        cid: registryToolInfo.cid,
        version: registryToolInfo.version
      },
      versionText
    };
  } 
  else {
    // Latest version installation
    spinner.text = `Looking for latest version of ${toolName}...`;
    const registryToolInfo = await getToolFromRegistry(toolName);
    
    if (!registryToolInfo) {
      throw new Error(`Tool '${toolName}' not found in registry`);
    }
    
    versionText = `(latest: ${registryToolInfo.version})`;
    spinner.text = `Installing ${toolName} ${versionText} ${installType} from registry...`;
    
    return {
      toolInfo: {
        name: registryToolInfo.name,
        cid: registryToolInfo.cid,
        version: registryToolInfo.version
      },
      versionText
    };
  }
}


/**
 * Main entry point for the install command
 */
export async function install(
  toolName: string,
  options: InstallOptions
): Promise<CommandResult> {
  const spinner = ora(`Installing ${toolName}...`).start();
  const isLocalInstall = !!options.local;
  const installType = isLocalInstall ? 'locally' : 'globally';
  
  try {
    const { toolInfo, versionText } = await resolveToolInfo(toolName, options, spinner);
    await performToolInstallation(toolInfo, isLocalInstall);
    spinner.succeed(`Successfully installed ${toolName} ${versionText} ${installType}`);

    return {
      success: true,
      message: `Successfully installed ${toolName} ${versionText} ${installType}`
    };
  } catch (error) {
    spinner.fail(`Failed to install ${toolName}`);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(errorMessage));
    
    return {
      success: false,
      message: `Failed to install ${toolName}: ${errorMessage}`
    };
  }
}
