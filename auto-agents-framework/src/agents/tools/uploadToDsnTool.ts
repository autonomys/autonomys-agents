import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { uploadToDsn } from './utils/dsnUploadToolUtils.js';
const logger = createLogger('upload-to-dsn-tool');

export const createUploadToDsnTool = () =>
  new DynamicStructuredTool({
    name: 'upload_to_dsn',
    description: 'Upload data to Dsn',
    schema: z.object({
      data: z.record(z.any()),
    }),
    func: async ({ data }: { data: Record<string, any> }) => {
      try {
        logger.info('Uploading data to DSN', { data });
        const uploadInfo = await uploadToDsn(data);
        return uploadInfo;
      } catch (error) {
        logger.error('Error uploading data to Dsn:', error);
        throw error; // Let the error propagate up
      }
    },
  });

export const invokeUploadToDsnTool = async (toolNode: ToolNode, data: object) => {
  const toolResponse = await toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'upload_to_dsn',
            args: { data },
            id: 'upload_to_dsn_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });
  return toolResponse;
};
