import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { UploadFileOptions } from '@autonomys/auto-drive';
import { ToolManifest, ToolMetadata } from '../types/index.js';
import { uploadFileToDsn } from './dsnClient.js';

/**
 * Creates a zip archive of a tool directory
 * @param toolPath Path to the tool directory
 * @returns Buffer containing the zip archive
 */
async function createToolPackage(toolPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const output: Buffer[] = [];
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Listen for data events to collect chunks
      archive.on('data', (chunk) => output.push(chunk));
      
      // When archive is finalized, create a Buffer from all chunks
      archive.on('end', () => {
        const buffer = Buffer.concat(output);
        resolve(buffer);
      });

      // Handle errors
      archive.on('error', (err) => {
        reject(err);
      });

      // Add entire directory
      archive.directory(toolPath, false);
      
      // Finalize the archive
      archive.finalize();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Uploads a tool package to Autonomys DSN
 * @param packageBuffer Buffer containing the packaged tool
 * @param manifest Tool manifest
 * @returns CID of the uploaded package
 */
async function uploadToolPackage(packageBuffer: Buffer, manifest: ToolManifest): Promise<string> {
  // Create a file object for auto-drive
  const file = {
    read: async function* () {
      yield packageBuffer;
    },
    name: `${manifest.name}-${manifest.version}.zip`,
    mimeType: 'application/zip',
    size: packageBuffer.length,
  };
  
  // Upload options
  const options: UploadFileOptions = {
    compression: true,
    password: process.env.AUTO_DRIVE_ENCRYPTION_PASSWORD,
  };
  
  // Upload to DSN using the client
  return await uploadFileToDsn(file, options);
}

/**
 * Packages a tool directory and uploads it to Autonomys DSN
 * @param toolPath Path to the tool directory
 * @returns Object containing the CID and tool metadata
 */
export async function packageAndUploadTool(toolPath: string): Promise<{ cid: string, metadata: ToolMetadata }> {
  // Read manifest file
  const manifestPath = path.join(toolPath, 'manifest.json');
  const manifestData = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestData) as ToolManifest;
  
  // Create package
  console.log('Creating tool package...');
  const packageBuffer = await createToolPackage(toolPath);
  
  // Upload package
  console.log('Uploading to Autonomys DSN...');
  const cid = await uploadToolPackage(packageBuffer, manifest);
  console.log(`Upload successful. CID: ${cid}`);
  
  // Create metadata
  const metadata: ToolMetadata = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    dependencies: manifest.dependencies,
    cid: cid,
    updated: new Date().toISOString()
  };
  
  return { cid, metadata };
} 