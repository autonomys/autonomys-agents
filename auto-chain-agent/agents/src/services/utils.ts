import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

interface UploadResponse {
  upload_id: string;
  status: string;
  completion: any;
}

export const uploadFile = async (fileBuffer: Buffer): Promise<UploadResponse> => {
  const baseUrl = 'https://demo.auto-drive.autonomys.xyz';
  const headers = {
    Authorization: `Bearer ${config.dsnApiKey}`,
    'X-Auth-Provider': 'apikey',
  };

  // Create upload request
  const createData = {
    filename: 'summary-differences.json',
    mimeType: 'application/json',
    uploadOptions: null,
  };

  const { data: uploadData } = await axios.post(`${baseUrl}/uploads/file`, createData, { headers });
  const uploadId = uploadData.id;

  // Upload chunk
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: 'summary-differences.json',
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

