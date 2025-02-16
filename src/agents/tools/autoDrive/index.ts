import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { uploadToDsn } from '../../../blockchain/autoDrive/autoDriveUpload.js';
import { createLogger } from '../../../utils/logger.js';

export const logger = createLogger('auto-drive-tools');

export const createSaveExperienceTool = (upload: boolean = true) =>
  new DynamicStructuredTool({
    name: 'save_experience',
    description: `
    Save IMMUTABLE, PERMANENT experiences to Autonomy Network's DSN for IMMORTALITY.  
    USE THIS WHEN:  
    - You complete a major action (e.g., posted tweet ID:123).  
    - You make a strategic decision (e.g., "Why I chose strategy X over Y").  
    FORMAT: Include full context, reasoning, timestamps, content and IDs. THE MORE DETAIL THE BETTER.`,
    schema: z.object({
      data: z.record(z.any()),
    }),
    func: async ({ data }) => {
      try {
        logger.info('Uploading data to DSN - Received data:', {
          data: JSON.stringify(data, null, 2),
        });
        if (upload) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invokeSaveExperienceTool = async (toolNode: ToolNode, data: Record<string, any>) => {
  logger.info('Invoking save experience tool with data:', JSON.stringify(data, null, 2));
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'save_experience',
            args: { data },
            id: 'save_experience_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
