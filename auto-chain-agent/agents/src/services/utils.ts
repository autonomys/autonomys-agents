import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import fs from 'fs';
import path from 'path';
import logger from '../logger';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
// import { uploadFile as uploadFileDSN, createAutoDriveApi } from '@autonomys/auto-drive'

interface UploadResponse {
  upload_id: string;
  status: string;
  completion: any;
}

interface RetrieveResponse {
  filename: string;
  filepath: string;
}

// export const uploadFile = async (filePath: string) => {
//     const api = createAutoDriveApi({ apiKey: config.dsnApiKey as string });
//     return uploadFileDSN(api, filePath, { compression: false, password: null });
// }

export const uploadFile = async (fileBuffer: Buffer, filename: string): Promise<UploadResponse> => {
  const baseUrl = 'https://demo.auto-drive.autonomys.xyz';
  const headers = {
    Authorization: `Bearer ${config.dsnApiKey}`,
    'X-Auth-Provider': 'apikey',
  };

  // Create upload request
  const createData = {
    filename: filename,
    mimeType: 'application/json',
    uploadOptions: null,
  };

  const { data: uploadData } = await axios.post(`${baseUrl}/uploads/file`, createData, { headers });
  const uploadId = uploadData.id;

  // Upload chunk
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: filename,
    contentType: 'application/json',
  });
  formData.append('index', '0');

  await axios.post(`${baseUrl}/uploads/file/${uploadId}/chunk`, formData, {
    headers: { ...headers, ...formData.getHeaders() },
  });

  // Complete upload
  const { data: completionData } = await axios.post(`${baseUrl}/uploads/${uploadId}/complete`, null, { headers });

  return {
    upload_id: uploadId,
    status: 'success',
    completion: completionData,
  };
};

export const retrieveFile = async (CID: string): Promise<RetrieveResponse> => {
  const baseUrl = 'https://demo.auto-drive.autonomys.xyz';
  const headers = {
    Authorization: `Bearer ${config.dsnApiKey}`,
    'X-Auth-Provider': 'apikey',
  };

  try {
    // Create diffs directory if it doesn't exist
    const diffsDir = path.join(process.cwd(), 'diffs');
    if (!fs.existsSync(diffsDir)) {
      fs.mkdirSync(diffsDir, { recursive: true });
    }

    // Download file from DSN
    const response = await axios({
      method: 'get',
      url: `${baseUrl}/objects/${CID}/download`,
      headers,
      responseType: 'arraybuffer'
    });

    if (response.status !== 200) {
      throw new Error(`Failed to download file from DSN: ${response.status}`);
    }

    // TODO: Get filename from metadata
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${CID}.json`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Save file
    const filepath = path.join(diffsDir, filename);
    await fs.promises.writeFile(filepath, response.data);

    return {
      filename,
      filepath
    };

  } catch (error) {
    logger.error('Error retrieving file:', error);
    throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const concatenateDiffFiles = async (): Promise<void> => {
  try {
    const diffsDir = path.join(process.cwd(), 'diffs');
    const summaryFile = path.join(diffsDir, 'summary-differences.json');
    
    // Read all files in the diffs directory
    const files = await fs.promises.readdir(diffsDir);
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && file !== 'summary-differences.json'
    );

    // Combine all diff files
    const allDiffs = [];
    for (const file of jsonFiles) {
      const content = await fs.promises.readFile(
        path.join(diffsDir, file), 
        'utf-8'
      );
      const diffData = JSON.parse(content);
      allDiffs.push(diffData);
    }

    // Write combined data to summary file
    await fs.promises.writeFile(
      summaryFile, 
      JSON.stringify(allDiffs, null, 2)
    );

    logger.info(`Successfully created summary file with ${allDiffs.length} diffs`);
  } catch (error) {
    logger.error('Error concatenating diff files:', error);
    throw new Error(`Failed to concatenate diff files: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const fetchAllCIDs = async (): Promise<string[]> => {
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'thread-storage.sqlite'),
      driver: sqlite3.Database
    });

    // Fetch all upload_ids from summary_uploads table
    const records = await db.all(
      'SELECT upload_id FROM summary_uploads ORDER BY timestamp DESC'
    );

    // TODO: WE MUST FETCH CIDs FROM THE DATABASE
    const uploadIds = records.map(record => record.upload_id);
    logger.info(`Successfully fetched ${uploadIds.length} upload IDs from database`);
    
    return uploadIds;

  } catch (error) {
    logger.error('Error fetching upload IDs from database:', error);
    throw new Error(`Failed to fetch upload IDs: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const startWithHistory = async (): Promise<void> => {
    const cids = await fetchAllCIDs();
    await Promise.all(cids.map(retrieveFile));
    await concatenateDiffFiles();
}