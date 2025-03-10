import { gmail_v1 } from '@googleapis/gmail';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import gmailClient from './client.js';

const logger = createLogger('gmail-tools');

/**
 * Creates a tool to read recent emails from Gmail
 */
export const createReadEmailsTool = (
  getRecentEmails: (maxResults: number) => Promise<gmail_v1.Schema$Thread[]>,
) =>
  new DynamicStructuredTool({
    name: 'read_gmail',
    description: `Read recent emails from Gmail.
    USE THIS WHEN:
    - You need to check recent emails
    - You want to find specific email threads
    FORMAT: Returns email threads with their messages and metadata.`,
    schema: z.object({
      maxResults: z
        .number()
        .describe('The maximum number of email threads to return. Default is 10.'),
    }),
    func: async ({ maxResults = 10 }) => {
      try {
        logger.info('Reading recent emails from Gmail');
        const emails = await getRecentEmails(maxResults);
        return JSON.stringify({ success: true, emails });
      } catch (error) {
        logger.error('Error reading emails from Gmail:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to send an email via Gmail
 */
export const createSendEmailTool = (
  sendEmail: (params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }) => Promise<{ success: boolean; messageId: string }>,
) =>
  new DynamicStructuredTool({
    name: 'send_gmail',
    description: `Send an email via Gmail.
    USE THIS WHEN:
    - You need to send a new email
    - You want to reply to an existing email thread
    FORMAT: Compose clear, professional emails with appropriate subject lines and content.`,
    schema: z.object({
      to: z.string().describe('The email address of the recipient'),
      subject: z.string().describe('The subject line of the email'),
      body: z.string().describe('The body content of the email'),
      threadId: z
        .string()
        .optional()
        .describe('The thread ID if this is a reply to an existing thread'),
    }),
    func: async ({ to, subject, body, threadId }) => {
      try {
        logger.info('Sending email via Gmail');
        const result = await sendEmail({ to, subject, body, threadId });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error sending email via Gmail:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to move an email to a different label in Gmail
 */
export const createMoveEmailTool = (
  moveEmail: (messageId: string, labelId: string) => Promise<{ success: boolean }>,
) =>
  new DynamicStructuredTool({
    name: 'move_gmail',
    description: `Move an email to a different label in Gmail.
    USE THIS WHEN:
    - You need to organize emails by moving them to specific labels
    - You want to archive emails by removing them from inbox`,
    schema: z.object({
      messageId: z.string().describe('The ID of the email message to move'),
      labelId: z.string().describe('The ID of the label to move the email to'),
    }),
    func: async ({ messageId, labelId }) => {
      try {
        logger.info('Moving email in Gmail');
        const result = await moveEmail(messageId, labelId);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error moving email in Gmail:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to delete (move to trash) an email in Gmail
 */
export const createDeleteEmailTool = (
  deleteEmail: (messageId: string) => Promise<{ success: boolean }>,
) =>
  new DynamicStructuredTool({
    name: 'delete_gmail',
    description: `Delete (move to trash) an email in Gmail.
    USE THIS WHEN:
    - You need to remove unwanted emails
    - You want to clean up your inbox`,
    schema: z.object({
      messageId: z.string().describe('The ID of the email message to delete'),
    }),
    func: async ({ messageId }) => {
      try {
        logger.info('Deleting email in Gmail');
        const result = await deleteEmail(messageId);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error deleting email in Gmail:', error);
        throw error;
      }
    },
  });

export const createGmailTools = async (credentials: { email: string; appPassword: string }) => {
  const gmail = await gmailClient(credentials);

  return [
    createReadEmailsTool(gmail.getRecentEmails),
    createSendEmailTool(gmail.sendEmail),
    createMoveEmailTool(gmail.moveEmail),
    createDeleteEmailTool(gmail.deleteEmail),
  ];
};

export default createGmailTools;
