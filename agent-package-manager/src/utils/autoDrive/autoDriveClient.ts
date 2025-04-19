import { createAutoDriveApi, UploadFileOptions } from '@autonomys/auto-drive';
import { loadConfig } from '../../config/index.js';
import { loadCredentials } from '../credential/index.js';

let apiClientInstance: ReturnType<typeof createAutoDriveApi> | null = null;

const createApiClient = async () => {
  if (apiClientInstance) {
    return apiClientInstance;
  }

  try {
    const config = await loadConfig();
    const credentials = await loadCredentials();

    if (credentials.autoDriveApiKey) {
      apiClientInstance = createAutoDriveApi({
        apiKey: credentials.autoDriveApiKey,
        network: config.autoDriveNetwork,
      });
      return apiClientInstance;
    }
    
    throw new Error("Missing Auto Drive API key. Please run 'autoOS config --credentials' to set up your credentials.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') && error.message.includes('credentials.enc')) {
        throw new Error("No credentials found. Please run 'autoOS config --credentials' to set up.");
      }
    }
    throw error;
  }
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

export { uploadFileToDsn, uploadMetadataToDsn };
