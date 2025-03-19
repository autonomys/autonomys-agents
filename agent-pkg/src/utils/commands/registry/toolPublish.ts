import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { UploadFileOptions } from '@autonomys/auto-drive';
import { ToolManifest, ToolMetadata } from '../../../types/index.js';
import { uploadFileToDsn } from '../../autoDrive/autoDriveClient.js';

/**
 * Creates a zip archive of a tool directory
 * @param toolPath Path to the tool directory
 * @returns Buffer containing the zip archive
 */
const createToolPackage = async (toolPath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const output: Buffer[] = [];
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      archive.on('data', chunk => output.push(chunk));

      archive.on('end', () => {
        const buffer = Buffer.concat(output);
        resolve(buffer);
      });

      archive.on('error', err => {
        reject(err);
      });

      archive.directory(toolPath, false);

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Uploads a tool package to Autonomys DSN
 * @param packageBuffer Buffer containing the packaged tool
 * @param manifest Tool manifest
 * @returns CID of the uploaded package
 */
const uploadToolPackage = async (
  packageBuffer: Buffer,
  manifest: ToolManifest,
): Promise<string> => {
  const file = {
    read: async function* () {
      yield packageBuffer;
    },
    name: `${manifest.name}-${manifest.version}.zip`,
    mimeType: 'application/zip',
    size: packageBuffer.length,
  };

  const options: UploadFileOptions = {
    compression: true,
    password: process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD,
  };

  return await uploadFileToDsn(file, options);
};

/**
 * Packages a tool directory and uploads it to Autonomys DSN
 * @param toolPath Path to the tool directory
 * @returns Object containing the CID and tool metadata
 */
export const packageAndUploadTool = async (
  toolPath: string,
): Promise<{ cid: string; metadata: ToolMetadata }> => {
  const manifestPath = path.join(toolPath, 'manifest.json');
  const manifestData = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestData) as ToolManifest;

  console.log('Creating tool package...');
  const packageBuffer = await createToolPackage(toolPath);

  console.log('Uploading to Autonomys DSN...');
  const cid = await uploadToolPackage(packageBuffer, manifest);
  console.log(`Upload successful. CID: ${cid}`);

  const metadata: ToolMetadata = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    cid: cid,
    updated: new Date().toISOString(),
  };

  return { cid, metadata };
};

