import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import axios from 'axios';

const logger = createLogger('webhook-issue-report-tool');

export const createWebhookIssueReportTool = (port: number) =>
  new DynamicStructuredTool({
    name: 'webhook_issue_report',
    description: `Report an issue to with the webhook`,
    schema: z.object({
      message: z.string().describe(`Comprehensive description of the issue in great details`),
    }),
    func: async ({ message }: { message: string }) => {
      logger.info('Reporting issue', { message });
      const _response = await axios.post(`http://localhost:${port}/api/webhook`, {
        type: 'issue',
        message,
      });
      return 'Issue reported';
    },
  });
