import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { UploadFileOptions } from '@autonomys/auto-drive';
import { ToolManifest, ToolMetadata, PublishedToolMetadata } from '../../../types/index.js';
import { uploadFileToDsn, uploadMetadataToDsn } from '../../autoDrive/autoDriveClient.js';
import { loadCredentials } from '../../credential/index.js';
import { validateToolStructure } from '../../validation.js';

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

const uploadToolPackage = async (
  packageBuffer: Buffer,
  manifest: ToolManifest,
): Promise<string> => {
  const credentials = await loadCredentials();
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
    password: credentials.autoDriveEncryptionPassword,
  };

  return await uploadFileToDsn(file, options);
};

const uploadToolMetadata = async (metadata: PublishedToolMetadata): Promise<string> => {
  const credentials = await loadCredentials();
  const options: UploadFileOptions = {
    compression: true,
    password: credentials.autoDriveEncryptionPassword,
  };
  console.log('Uploading tool metadata...');
  return await uploadMetadataToDsn(
    metadata,
    `${metadata.name}-${metadata.version}-metadata.json`,
    options,
  );
};

const packageAndUploadTool = async (
  toolPath: string,
): Promise<{ cid: string; metadataCid: string; metadata: ToolMetadata }> => {
  // Validate tool structure before packaging
  const validationResult = await validateToolStructure(toolPath);
  if (!validationResult.valid) {
    throw new Error(`Tool validation failed: ${validationResult.message}`);
  }

  const manifestPath = path.join(toolPath, 'manifest.json');
  const manifestData = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestData) as ToolManifest;

  console.log('Creating tool package...');
  const packageBuffer = await createToolPackage(toolPath);

  console.log('Uploading to Autonomys DSN...');
  const cid = await uploadToolPackage(packageBuffer, manifest);
  console.log(`Upload successful. CID: ${cid}`);

  const publishedMetadata: PublishedToolMetadata = {
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    cid: cid,
    updated: new Date().toISOString(),
    dependencies: manifest.dependencies,
  };

  const metadataCid = await uploadToolMetadata(publishedMetadata);
  const metadata: ToolMetadata = {
    ...publishedMetadata,
    metadataCid: metadataCid,
  };
  return { cid, metadataCid, metadata };
};

export { packageAndUploadTool };
