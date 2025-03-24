import {
  createAutoDriveApi,
  UploadFileOptions,
  
} from '@autonomys/auto-drive';
import { loadConfig } from '../../config/index.js';
import { loadCredentials } from '../credential/index.js';

// TODO: Another design choice is to create a const function in a state file? then, change the function signature of uploading and downloading to include the apiClientInstance.
let apiClientInstance: ReturnType<typeof createAutoDriveApi> | null = null;

const createApiClient = async () => {
  if (apiClientInstance) {
    return apiClientInstance;
  }

  const config = await loadConfig();
  const credentials = await loadCredentials();

  if (credentials.autoDriveApiKey) {
    apiClientInstance = createAutoDriveApi({
      apiKey: credentials.autoDriveApiKey,
      network: config.autoDriveNetwork,
    });
    return apiClientInstance;
  }
  throw new Error(
    "Missing Auto Drive API key. Please run 'autoOS config' to set up your credentials.",
  );
};

const uploadFileToDsn = async (
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
    const credentials = await loadCredentials();

    let uploadOptions = options || { compression: true };

    if (!uploadOptions.password && credentials.autoDriveEncryptionPassword) {
      uploadOptions.password = credentials.autoDriveEncryptionPassword;
    }

    const cid = await api.uploadFile(file, uploadOptions);
    console.log(`Upload successful. CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error('Error uploading to Auto Drive:', error);
    throw error;
  }
};

const uploadMetadataToDsn = async (
  object: unknown,
  name: string,
  options?: UploadFileOptions,
): Promise<string> => {
  try {
    const api = await createApiClient();
    const credentials = await loadCredentials();

    let uploadOptions = options || { compression: true };

    if (!uploadOptions.password && credentials.autoDriveEncryptionPassword) {
      uploadOptions.password = credentials.autoDriveEncryptionPassword;
    }

    const cid = await api.uploadObjectAsJSON(object, name, uploadOptions);
    console.log(`Upload successful. CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error('Error uploading object to DSN:', error);
    throw error;
  }
};

const downloadFileFromDsn = async (
  cid: string,
  password?: string,
): Promise<AsyncIterable<Buffer>> => {
  try {
    console.log(`Downloading file with CID: ${cid}`);

    const api = await createApiClient();

    if (!password) {
      const credentials = await loadCredentials();

      if (credentials.autoDriveEncryptionPassword) {
        password = credentials.autoDriveEncryptionPassword;
      }
    }
    return await api.downloadFile(cid, password);
  } catch (error) {
    console.error('Error downloading from Auto Drive:', error);
    throw error;
  }
};

const downloadMetadataFromDsn = async (cid: string, password?: string): Promise<unknown> => {
  try {
    const fileStream = await downloadFileFromDsn(cid, password);

    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }

    const jsonData = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error downloading object from DSN:', error);
    throw error;
  }
};

export { uploadFileToDsn, uploadMetadataToDsn, downloadFileFromDsn, downloadMetadataFromDsn };
