import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { AIMessage } from '@langchain/core/messages';
import { invokeUploadToDsnTool } from '../../../tools/uploadToDsnTool.js';

const logger = createLogger('upload-to-dsn-node');

export const createUploadToDsnNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Upload to Dsn Node - Starting upload');

    if (!state.dsnData) {
      logger.error('No DSN data available');
      return;
    }

    const dataToUpload = {
      ...state.dsnData,
    };

    logger.info('Upload to Dsn Node - Data to upload', { dataToUpload });

    const uploadInfo = await invokeUploadToDsnTool(config.toolNode, dataToUpload);
    logger.info('Upload to Dsn Node - Upload complete', { uploadInfo });

    return {
      messages: [new AIMessage({ content: JSON.stringify(uploadInfo) })],
    };
  };
