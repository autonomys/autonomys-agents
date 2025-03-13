import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import axios from 'axios';

const logger = createLogger('webhook-issue-report-tool');

// This tool will be used to report issues to the webhook of other agents in future.
export const createWebhookIssueReportTool = (url: string) =>
  new DynamicStructuredTool({
    name: 'webhook_issue_report',
    description: `Report an issue to with the webhook`,
    schema: z.object({
      message: z.string().describe(`Comprehensive description of the issue in great details`),
    }),
    func: async ({ message }: { message: string }) => {
      logger.info('Reporting issue', { message });
      try {
        const _response = await axios.post(`${url}/api/webhook`, {
          type: 'issue',
          message,
        });
        return {
          success: true,
          message: 'Issue reported',
        };
      } catch (error) {
        logger.error('Failed to report issue', { error });
        return {
          success: false,
          message: 'Failed to report issue',
        };
      }
    },
  });
