import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { uploadToDsn } from './utils/dsn/dsnUpload.js';
import { config } from '../../config/index.js';

const logger = createLogger('save-experience-tool');

export const createSaveExperienceTool = () =>
  new DynamicStructuredTool({
    name: 'save_experience',
    description: 'Save experience permanently to Autonomy DSN',
    schema: z.object({
      data: z.record(z.any()),
    }),
    func: async ({ data }) => {
      try {
        logger.info('Uploading data to DSN - Received data:', {
          data: JSON.stringify(data, null, 2),
        });
        if (config.autoDriveConfig.AUTO_DRIVE_UPLOAD) {
          const upload: { success: boolean; cid: string; previousCid: string | null } =
            await uploadToDsn(data);
          logger.info('Uploading data to DSN - Upload info:', JSON.stringify(upload, null, 2));
          return upload;
        }
        logger.info('AutoDrive upload is disabled, skipping upload');
        return { success: false, cid: null, previousCid: null };
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
