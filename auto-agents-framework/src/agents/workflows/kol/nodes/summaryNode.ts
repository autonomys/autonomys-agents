import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';

const logger = createLogger('analyze-timeline-trend-node');

export const createSummaryNode = (config: WorkflowConfig) => async (state: typeof State.State) => {
  logger.info('Summary Node - Summarizing trends');
};
