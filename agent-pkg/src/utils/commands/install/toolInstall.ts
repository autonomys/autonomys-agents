import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import ora from 'ora';
import { getToolInstallDir, PACKAGES_DIR } from '../../shared/path.js';
import { getToolFromRegistry, getToolVersionFromRegistry } from '../registry/toolInquiry.js';
import { downloadFileFromDsn } from '../../autoDrive/autoDriveClient.js';
import { InstallOptions, ToolInstallInfo, ToolMetadata } from '../../../types/index.js';
import { getCredentials } from '../../credential/index.js';

/**
 * Downloads a tool package from Autonomys DSN to the local cache
 * @param cid Content identifier for the tool package
 * @returns Path to the downloaded package file
 */
export const fetchToolPackage = async (cid: string): Promise<string> => {
  const credentials = await getCredentials();
  const packagePath = path.join(PACKAGES_DIR, `${cid}.zip`);

  try {
    console.log(`Downloading tool package with CID: ${cid}`);
    const fileStream = await downloadFileFromDsn(cid, credentials.autoDriveEncryptionPassword);

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
};

/**
 * Extracts a zip package to the target installation directory
 * @param packagePath Path to the downloaded package file
 * @param toolName Name of the tool
 * @param targetDir Target directory for installation
 * @returns Path to the extracted tool directory
 */
export const unpackToolToDirectory = async (
  packagePath: string,
  toolName: string,
  targetDir: string,
): Promise<string> => {
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
};

/**
 * Executes the complete tool installation process
 * @param toolInfo Tool metadata for installation
 * @param isLocalInstall Whether to install locally
 * @returns Path to the installed tool directory
 */
export const performToolInstallation = async (
  toolInfo: ToolInstallInfo,
  isLocalInstall: boolean,
): Promise<string> => {
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
};

/**
 * Validates options for CID-based installation
 * @param cid The Content ID to validate
 * @throws Error if CID is missing
 */
export function validateCidOption(cid: string | undefined): asserts cid is string {
  if (!cid) {
    throw new Error('CID is required when installing a tool by CID');
  }
}

/**
 * Validates options for version-based installation
 * @param version The version string to validate
 * @throws Error if version is missing
 */
export function validateVersionOption(version: string | undefined): asserts version is string {
  if (!version) {
    throw new Error('Version is required when installing a specific version');
  }
}

/**
 * Creates tool info from a registry lookup result
 * @param registryInfo Registry tool information
 * @returns Formatted tool installation info
 */
export const createToolInfoFromRegistry = (registryInfo: ToolMetadata): ToolInstallInfo => {
  return {
    name: registryInfo.name,
    cid: registryInfo.cid,
    version: registryInfo.version,
  };
};

/**
 * Resolves installation info for a tool using its CID
 * @param toolName Name of the tool
 * @param cid Content identifier
 * @returns Tool info and version display text
 */
export const resolveCidInstallation = (
  toolName: string,
  cid: string,
): {
  toolInfo: ToolInstallInfo;
  versionDisplay: string;
} => {
  return {
    toolInfo: {
      name: toolName,
      cid,
    },
    versionDisplay: '',
  };
};

/**
 * Resolves installation info for a specific version of a tool
 * @param toolName Name of the tool
 * @param version Version to install
 * @param spinner Progress spinner
 * @returns Tool info and version display text
 */
export const resolveVersionInstallation = async (
  toolName: string,
  version: string,
  spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
  const versionDisplay = `version ${version}`;
  spinner.text = `Looking for ${toolName} ${versionDisplay}...`;

  const registryToolInfo = await getToolVersionFromRegistry(toolName, version);
  if (!registryToolInfo) {
    throw new Error(
      `${versionDisplay} of tool '${toolName}' not found in registry. Use 'autoOS list -d' to see available versions.`,
    );
  }

  return {
    toolInfo: createToolInfoFromRegistry(registryToolInfo),
    versionDisplay,
  };
};

/**
 * Resolves installation info for the latest version of a tool
 * @param toolName Name of the tool
 * @param spinner Progress spinner
 * @returns Tool info and version display text
 */
export const resolveLatestInstallation = async (
  toolName: string,
  spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
  spinner.text = `Looking for latest version of ${toolName}...`;
  const registryToolInfo = await getToolFromRegistry(toolName);

  if (!registryToolInfo) {
    throw new Error(`Tool '${toolName}' not found in registry`);
  }

  const versionDisplay = `(latest: ${registryToolInfo.version})`;

  return {
    toolInfo: createToolInfoFromRegistry(registryToolInfo),
    versionDisplay,
  };
};

/**
 * Updates spinner text with installation source info
 * @param spinner The progress spinner
 * @param toolName Name of the tool being installed
 * @param versionDisplay Version information to display
 * @param installType Installation type (locally/globally)
 */
export const updateSpinnerWithInstallInfo = (
  spinner: ReturnType<typeof ora>,
  toolName: string,
  versionDisplay: string,
  installType: string,
): void => {
  spinner.text = `Installing ${toolName} ${versionDisplay} ${installType} from registry...`;
};

/**
 * Resolves tool information from different sources (CID, version, latest)
 * @param toolName Name of the tool to install
 * @param options Installation options
 * @param spinner Progress spinner for UI updates
 * @returns Tool information and descriptive version display text
 */
export const resolveToolInfo = async (
  toolName: string,
  options: InstallOptions,
  spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
  const installType = options.local ? 'locally' : 'globally';

  // Handle CID-based installation
  if (options.cid) {
    validateCidOption(options.cid);
    spinner.text = `Installing ${toolName} ${installType} using CID: ${options.cid}`;
    return resolveCidInstallation(toolName, options.cid);
  }

  // Handle version-based installation
  if (options.version) {
    validateVersionOption(options.version);
    const result = await resolveVersionInstallation(toolName, options.version, spinner);
    updateSpinnerWithInstallInfo(spinner, toolName, result.versionDisplay, installType);
    return result;
  }

  // Handle latest version installation (default)
  const result = await resolveLatestInstallation(toolName, spinner);
  updateSpinnerWithInstallInfo(spinner, toolName, result.versionDisplay, installType);
  return result;
};
