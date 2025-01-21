import { createAutoDriveApi, downloadFile } from '@autonomys/auto-drive';
import { config } from '../../../../config/index.js';
import { createLogger } from '../../../../utils/logger.js';
import { withRetry } from './retry.js';

const logger = createLogger('dsn-download');

interface BaseMemory {
  previousCid?: string;
  timestamp?: string;
  agentVersion?: string;
  [key: string]: unknown;
}

export const download = async (cid: string): Promise<BaseMemory> => {
  return withRetry(
    async () => {
      const api = createAutoDriveApi({
        apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY || '',
      });
      logger.info(`Downloading file: ${cid}`);
      const stream = await downloadFile(api, cid);

      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      const jsonString = new TextDecoder().decode(allChunks);
      const data = JSON.parse(jsonString);

      return data;
    },
    {
      shouldRetry: error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return !(
          errorMessage.includes('Not Found') || errorMessage.includes('incorrect header check')
        );
      },
    },
  );
};
