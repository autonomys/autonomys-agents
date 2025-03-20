import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import ora from 'ora';
import { getToolInstallDir, PACKAGES_DIR } from '../../shared/path.js';
import { getToolFromRegistry, getToolVersionFromRegistry } from '../registry/toolInquiry.js';
import { downloadFileFromDsn } from '../../autoDrive/autoDriveClient.js';
import { InstallOptions, ToolInstallInfo, ToolMetadata } from '../../../types/index.js';
import { loadCredentials } from '../../credential/index.js';
import { getCidFromHash } from '../../blockchain/utils.js';


const fetchToolPackage = async (cidHash: string): Promise<string> => {
  const cid = getCidFromHash(cidHash);
  const credentials = await loadCredentials();
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


const unpackToolToDirectory = async (
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


const performToolInstallation = async (
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


const validateCidOption = (cid: string | undefined): string => {
  if (!cid) {
    throw new Error('CID is required when installing a tool by CID');
  }
  return cid;
}


const validateVersionOption = (version: string | undefined): string => {
  if (!version) {
    throw new Error('Version is required when installing a specific version');
  }
  return version;
}


export const createToolInfoFromRegistry = (registryInfo: ToolMetadata): ToolInstallInfo => {
  return {
    name: registryInfo.name,
    cid: registryInfo.cid,
    version: registryInfo.version,
  };
};


const resolveCidInstallation = (
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


const resolveVersionInstallation = async (
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


const resolveLatestInstallation = async (
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


const updateSpinnerWithInstallInfo = (
  spinner: ReturnType<typeof ora>,
  toolName: string,
  versionDisplay: string,
  installType: string,
): void => {
  spinner.text = `Installing ${toolName} ${versionDisplay} ${installType} from registry...`;
};


const resolveToolInfo = async (
  toolName: string,
  options: InstallOptions,
  spinner: ReturnType<typeof ora>,
): Promise<{ toolInfo: ToolInstallInfo; versionDisplay: string }> => {
  const installType = options.local ? 'locally' : 'globally';

  // Handle CID-based installation
  if (options.cid) {
    const validCid = validateCidOption(options.cid);
    spinner.text = `Installing ${toolName} ${installType} using CID: ${validCid}`;
    return resolveCidInstallation(toolName, validCid);
  }

  // Handle version-based installation
  if (options.version) {
    const validVersion = validateVersionOption(options.version);
    const result = await resolveVersionInstallation(toolName, validVersion, spinner);
    updateSpinnerWithInstallInfo(spinner, toolName, result.versionDisplay, installType);
    return result;
  }

  // Handle latest version installation (default)
  const result = await resolveLatestInstallation(toolName, spinner);
  updateSpinnerWithInstallInfo(spinner, toolName, result.versionDisplay, installType);
  return result;
};

export {
  fetchToolPackage,
  unpackToolToDirectory,
  performToolInstallation,
  validateCidOption,
  validateVersionOption,
  resolveToolInfo
}