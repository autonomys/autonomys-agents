import { TwitterWorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../twitterWorkflow.js';
import { AIMessage } from '@langchain/core/messages';
import { invokeUploadToDsnTool } from '../../../tools/uploadToDsnTool.js';

const logger = createLogger('upload-to-dsn-node');

export const createUploadToDsnNode =
  (config: TwitterWorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Upload to Dsn Node - Starting upload');
    const { dsnData } = state;

    if (!state.dsnData) {
      logger.error('No DSN data available');
      return;
    }

    logger.info('Upload to Dsn Node - Data to upload', { dsnData });

    const uploadInfo = await invokeUploadToDsnTool(config.toolNode, dsnData);
    logger.info('Upload to Dsn Node - Upload complete', { uploadInfo });

    return {
      messages: [new AIMessage({ content: JSON.stringify(uploadInfo) })],
      dsnData: [],
    };
  };
