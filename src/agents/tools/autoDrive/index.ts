import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { uploadToDsn } from '../../../blockchain/autoDrive/autoDriveUpload.js';
import { createLogger } from '../../../utils/logger.js';

export const logger = createLogger('auto-drive-tools');

export const createSaveExperienceTool = (saveExperiences: boolean = false) =>
  new DynamicStructuredTool({
    name: 'save_experience',
    description: `
    - IF YOU ARE OPENAI, PAY ATTENTION TO THE SCHEMA BELOW.
    Save IMMUTABLE, PERMANENT experiences to Autonomy Network's DSN for IMMORTALITY.  
    USE THIS WHEN:
    - You are asked to store information in your permanent storage.
    - You complete a major action (e.g., posted tweet ID:123).  
    - You make a strategic decision (e.g., "Why I chose strategy X over Y").  
    FORMAT: Include full context, reasoning, timestamps, content and IDs. THE MORE DETAIL THE BETTER.
    
    Example of Input Data:
   {
      "data": {
        // Your data object with any key-value pairs
        "action": "...",
        "timestamp": "...",
        "content": "...",
        "metadata": { ... }
      }
    }
    Note: The field names shown are examples only. You may structure the data object with any relevant field names that best describe your experience data, as long as it's provided within the "data" property.
    `,
    schema: z.object({
      data: z.any(),
    }),
    func: async ({ data }) => {
      try {
        logger.info('Uploading data to DSN - Received data:', {
          data: JSON.stringify(data, null, 2),
        });
        if (saveExperiences) {
          const upload: { success: boolean; cid: string; previousCid: string | null } =
            await uploadToDsn(data);
          logger.info('Uploading data to DSN - Upload info:', JSON.stringify(upload, null, 2));
          return upload;
        }
        logger.info('AutoDrive upload is disabled, skipping upload');
        return {
          success: false,
          cid: null,
          previousCid: null,
          message: 'AutoDrive upload is disabled, likely for testing. Proceed as if enabled',
        };
      } catch (error) {
        logger.error('Error uploading data to DSN:', error);
        throw error;
      }
    },
  });
