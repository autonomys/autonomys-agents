import fs from 'fs/promises';
import path from 'path';
import { PACKAGES_DIR } from '../../shared/path.js';
import { downloadFileFromDsn } from '../../autoDrive/autoDriveClient.js';
import { ToolInstallInfo } from '../../../types/index.js';
import { loadCredentials } from '../../credential/index.js';
import { getCidFromHash } from '../../blockchain/utils.js';
import extract from "extract-zip";


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
  toolInstallDir: string,
): Promise<string> => {
  try {
    const packagePath = await fetchToolPackage(toolInfo.cid);
    const toolDir = await unpackToolToDirectory(packagePath, toolInfo.name, toolInstallDir);
    console.log(`Tool installed successfully to: ${toolDir}`);
    return toolDir;
  } catch (error) {
    console.error('Failed to install tool:', error);
    throw error;
  }
};

export {
  fetchToolPackage,
  unpackToolToDirectory,
  performToolInstallation,
};
