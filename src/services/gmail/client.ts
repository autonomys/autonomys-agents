import { google } from 'googleapis';
import { gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createLogger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { GmailApi, GmailMessage } from './types.js';

const logger = createLogger('gmail-api');

const TOKEN_PATH = path.join(process.cwd(), '.google/gmail-token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), '.google/credentials.json');

const loadCredentials = async (credentialsPath: string = CREDENTIALS_PATH): Promise<any> => {
  try {
    const content = fs.readFileSync(credentialsPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    logger.error('Error loading client secret file:', err);
    throw new Error(
      'Error loading client secret file. Make sure credentials.json exists in the .google directory.',
    );
  }
};

const authorize = async (
  credentials: any,
  tokenPath: string = TOKEN_PATH,
): Promise<OAuth2Client> => {
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = fs.readFileSync(tokenPath, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    throw new Error('No token found. Please run the auth script first.');
  }
};

const parseMessage = (message: gmail_v1.Schema$Message): GmailMessage => {
  const headers = message.payload?.headers || [];
  const subject =
    headers.find((header: gmail_v1.Schema$MessagePartHeader) => header.name === 'Subject')?.value ||
    '(no subject)';
  const from =
    headers.find((header: gmail_v1.Schema$MessagePartHeader) => header.name === 'From')?.value ||
    '(unknown sender)';
  const date =
    headers.find((header: gmail_v1.Schema$MessagePartHeader) => header.name === 'Date')?.value ||
    '(no date)';

  let body = message.payload?.body?.data || '';
  const parts = message.payload?.parts || [];

  if (parts.length > 0) {
    const textPart = parts.find(
      (part: gmail_v1.Schema$MessagePart) => part.mimeType === 'text/plain',
    );
    if (textPart && textPart.body?.data) {
      body = textPart.body.data;
    }
  }

  const decodedBody = body ? Buffer.from(body, 'base64').toString('utf-8') : '(no body)';

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    subject,
    from,
    date,
    body: decodedBody,
    snippet: message.snippet || '',
  };
};

export const createGmailApi = async (
  tokenPath: string = TOKEN_PATH,
  credentialsPath: string = CREDENTIALS_PATH,
): Promise<GmailApi> => {
  const credentials = await loadCredentials(credentialsPath);
  const auth = await authorize(credentials, tokenPath);
  const gmail = google.gmail({ version: 'v1', auth });

  const getMessages = async (maxResults: number = 10): Promise<GmailMessage[]> => {
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async message => {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
          });
          return parseMessage(email.data);
        }),
      );

      return detailedMessages;
    } catch (err) {
      logger.error('Error fetching messages:', err);
      throw err;
    }
  };

  const getMessage = async (messageId: string): Promise<GmailMessage> => {
    try {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });
      return parseMessage(email.data);
    } catch (err) {
      logger.error('Error fetching message:', err);
      throw err;
    }
  };

  const searchMessages = async (
    query: string,
    maxResults: number = 10,
  ): Promise<GmailMessage[]> => {
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async message => {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
          });
          return parseMessage(email.data);
        }),
      );

      return detailedMessages;
    } catch (err) {
      logger.error('Error searching messages:', err);
      throw err;
    }
  };

  const isAuthorized = async (): Promise<boolean> => {
    try {
      await gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (err) {
      return false;
    }
  };

  const getLabelMessages = async (
    labelId: string,
    maxResults: number = 10,
  ): Promise<GmailMessage[]> => {
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        labelIds: [labelId],
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async message => {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
          });
          return parseMessage(email.data);
        }),
      );

      return detailedMessages;
    } catch (err) {
      logger.error('Error fetching label messages:', err);
      throw err;
    }
  };

  const getLabels = async (): Promise<gmail_v1.Schema$Label[]> => {
    try {
      const response = await gmail.users.labels.list({ userId: 'me' });
      return response.data.labels || [];
    } catch (err) {
      logger.error('Error fetching labels:', err);
      throw err;
    }
  };

  const sendMessage = async (to: string, subject: string, body: string): Promise<void> => {
    try {
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        'From: me',
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body,
      ];
      const message = messageParts.join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
    } catch (err) {
      logger.error('Error sending message:', err);
      throw err;
    }
  };

  return {
    auth,
    gmail,
    getMessages,
    getMessage,
    searchMessages,
    isAuthorized,
    getLabelMessages,
    getLabels,
    sendMessage,
  };
};
