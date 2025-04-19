import axios from 'axios';
import { Readable } from 'stream';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Delay utility function
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Downloads a file from the Autonomys gateway using a CID
 */
export const downloadFileFromGateway = async (
  cid: string,
  retryCount = 0
): Promise<AsyncIterable<Buffer>> => {
  try {
    console.log(`Downloading file with CID from gateway: ${cid}`);
    
    const response = await axios.get(`https://gateway.autonomys.xyz/file/${cid}`, {
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(response.data);
    
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    
    return readable;
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes('Not Found')) {
      console.error(`File with CID ${cid} not found.`);
      throw new Error(`File with CID ${cid} not found.`);
    }
    
    if (retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(`Failed to download file, retrying in ${retryDelay}ms`, {
        cid,
        retryCount: retryCount + 1,
        error: errorMessage,
      });
      
      await delay(retryDelay);
      return downloadFileFromGateway(cid, retryCount + 1);
    }
    
    console.error('Error downloading from gateway:', error);
    throw error;
  }
};