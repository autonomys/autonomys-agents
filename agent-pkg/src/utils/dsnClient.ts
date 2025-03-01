import { createAutoDriveApi, uploadFile, downloadFile, UploadFileOptions } from '@autonomys/auto-drive';
import { ToolRegistry } from '../types/index.js';

// Initialize the auto-drive API
export const autoDriveApi = createAutoDriveApi({
  apiKey: process.env.AUTO_DRIVE_API_KEY || '',
  network: process.env.AUTO_DRIVE_NETWORK === 'taurus' ? 'taurus' : 'mainnet',
});

// Known entry point CID for the registry
export const REGISTRY_ENTRY_CID = 'PLACEHOLDER_REGISTRY_CID'; // We'll create this when we first publish the registry

/**
 * Upload a file to Autonomys DSN
 * @param file File object with read generator
 * @param options Upload options
 * @returns Promise resolving to the CID
 */
export const uploadFileToDsn = async (
  file: { 
    read: () => AsyncGenerator<Buffer>, 
    name: string, 
    mimeType: string, 
    size: number 
  }, 
  options: UploadFileOptions
): Promise<string> => {
  try {
    console.log(`Uploading file: ${file.name}`);
    const cid = await uploadFile(autoDriveApi, file, options);
    console.log(`Upload successful. CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error('Error uploading to DSN:', error);
    throw error;
  }
};

/**
 * Upload an object as JSON to Autonomys DSN
 * @param object The object to upload as JSON
 * @param name Filename to use
 * @param options Upload options
 * @returns Promise resolving to the CID
 */
export const uploadObjectToDsn = async (
  object: any,
  name: string,
  options: UploadFileOptions = { compression: true }
): Promise<string> => {
  try {
    // Convert object to JSON buffer
    const jsonData = JSON.stringify(object, null, 2);
    const buffer = Buffer.from(jsonData);
    
    // Create file object
    const file = {
      read: async function* () {
        yield buffer;
      },
      name,
      mimeType: 'application/json',
      size: buffer.length,
    };
    
    // Upload
    return await uploadFileToDsn(file, options);
  } catch (error) {
    console.error('Error uploading object to DSN:', error);
    throw error;
  }
};

/**
 * Download a file from Autonomys DSN
 * @param cid Content identifier
 * @param password Optional password for encrypted files
 * @returns AsyncIterable of file chunks
 */
export const downloadFileFromDsn = async (
  cid: string,
  password?: string
): Promise<AsyncIterable<Buffer>> => {
  try {
    console.log(`Downloading file with CID: ${cid}`);
    return await downloadFile(autoDriveApi, cid, password);
  } catch (error) {
    console.error('Error downloading from DSN:', error);
    throw error;
  }
};

/**
 * Download and parse a JSON object from Autonomys DSN
 * @param cid Content identifier for the JSON object
 * @param password Optional password for encrypted files
 * @returns Parsed object
 */
export const downloadObjectFromDsn = async <T>(
  cid: string,
  password?: string
): Promise<T> => {
  try {
    const fileStream = await downloadFileFromDsn(cid, password);
    
    // Buffer to store downloaded data
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    
    // Parse JSON
    const jsonData = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(jsonData) as T;
  } catch (error) {
    console.error('Error downloading object from DSN:', error);
    throw error;
  }
};

/**
 * Download the tool registry from DSN
 * @returns The parsed registry object
 */
export const downloadRegistry = async (): Promise<ToolRegistry> => {
  try {
    return await downloadObjectFromDsn<ToolRegistry>(REGISTRY_ENTRY_CID);
  } catch (error) {
    console.error('Error downloading registry:', error);
    throw error;
  }
};

/**
 * Upload the registry to DSN
 * @param registry The registry object to upload
 * @returns CID of the uploaded registry
 */
export const uploadRegistry = async (registry: ToolRegistry): Promise<string> => {
  try {
    return await uploadObjectToDsn(
      registry, 
      `registry-${registry.version}-${registry.updated}.json`
    );
  } catch (error) {
    console.error('Error uploading registry:', error);
    throw error;
  }
}; 