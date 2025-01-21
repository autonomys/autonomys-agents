import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { uploadToDsn } from './utils/dsn/dsnUpload.js';

const logger = createLogger('upload-to-dsn-tool');

export const createUploadToDsnTool = () =>
  new DynamicStructuredTool({
    name: 'upload_to_dsn',
    description: 'Upload data to Dsn',
    schema: z.object({
      data: z.array(z.record(z.any())),
    }),
    func: async ({ data }) => {
      try {
        logger.info('Uploading data to DSN - Received data:', JSON.stringify(data, null, 2));
        const uploadInfo: { success: boolean; cid: string; previousCid: string | null }[] = [];
        for (const d of data) {
          const upload = await uploadToDsn(d);
          uploadInfo.push(upload);
        }
        logger.info('Uploading data to DSN - Upload info:', JSON.stringify(uploadInfo, null, 2));
        return uploadInfo;
      } catch (error) {
        logger.error('Error uploading data to Dsn:', error);
        throw error;
      }
    },
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invokeUploadToDsnTool = async (toolNode: ToolNode, data: Record<string, any>[]) => {
  logger.info('Invoking upload to DSN tool with data:', JSON.stringify(data, null, 2));
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
