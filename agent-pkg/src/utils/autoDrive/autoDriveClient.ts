import {
  createAutoDriveApi,
  downloadFile,
  uploadFile,
  UploadFileOptions,
} from '@autonomys/auto-drive';
import { initializeConfigAndCredentials } from '../../config/index.js';

const createApiClient = async () => {
  const { config, credentials } = await initializeConfigAndCredentials();

  if (credentials.autoDriveApiKey) {
    return createAutoDriveApi({
      apiKey: credentials.autoDriveApiKey,
      network: config.autoDriveNetwork === 'taurus' ? 'taurus' : 'mainnet',
    });
  }
  throw new Error(
    "Missing Auto Drive API key. Please run 'autoOS config' to set up your credentials.",
  );
};

/**
 * Upload a file to Autonomys DSN
 * @param file File object with read generator
 * @param options Upload options
 * @returns Promise resolving to the CID
 */
export const uploadFileToDsn = async (
  file: {
    read: () => AsyncGenerator<Buffer>;
    name: string;
    mimeType: string;
    size: number;
  },
  options?: UploadFileOptions,
): Promise<string> => {
  try {
    console.log(`Uploading file: ${file.name}`);

    const api = await createApiClient();
    const { credentials } = await initializeConfigAndCredentials();

    let uploadOptions = options || { compression: true };

    if (!uploadOptions.password && credentials.autoDriveEncryptionPassword) {
      uploadOptions.password = credentials.autoDriveEncryptionPassword;
    }

    const cid = await uploadFile(api, file, uploadOptions);
    console.log(`Upload successful. CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error('Error uploading to Auto Drive:', error);
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
  object: unknown,
  name: string,
  options?: UploadFileOptions,
): Promise<string> => {
  try {
    const jsonData = JSON.stringify(object, null, 2);
    const buffer = Buffer.from(jsonData);

    const file = {
      read: async function* () {
        yield buffer;
      },
      name,
      mimeType: 'application/json',
      size: buffer.length,
    };

    return await uploadFileToDsn(file, options || { compression: true });
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
  password?: string,
): Promise<AsyncIterable<Buffer>> => {
  try {
    console.log(`Downloading file with CID: ${cid}`);

    const api = await createApiClient();

    if (!password) {
      const { credentials } = await initializeConfigAndCredentials();

      if (credentials.autoDriveEncryptionPassword) {
        password = credentials.autoDriveEncryptionPassword;
      }
    }
    return await downloadFile(api, cid, password);
  } catch (error) {
    console.error('Error downloading from Auto Drive:', error);
    throw error;
  }
};

/**
 * Download and parse a JSON object from Autonomys DSN
 * @param cid Content identifier for the JSON object
 * @param password Optional password for encrypted files
 * @returns Parsed object
 */
export const downloadObjectFromDsn = async <T>(cid: string, password?: string): Promise<T> => {
  try {
    const fileStream = await downloadFileFromDsn(cid, password);

    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }

    const jsonData = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(jsonData) as T;
  } catch (error) {
    console.error('Error downloading object from DSN:', error);
    throw error;
  }
};
