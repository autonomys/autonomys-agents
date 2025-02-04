import { OAuth2Client } from 'google-auth-library';
import { gmail_v1 } from 'googleapis';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  snippet: string;
}

export interface GmailApi {
  auth: OAuth2Client;
  gmail: gmail_v1.Gmail;
  getMessages: (maxResults?: number) => Promise<GmailMessage[]>;
  getMessage: (messageId: string) => Promise<GmailMessage>;
  searchMessages: (query: string, maxResults?: number) => Promise<GmailMessage[]>;
  isAuthorized: () => Promise<boolean>;
  getLabelMessages: (labelId: string, maxResults?: number) => Promise<GmailMessage[]>;
  getLabels: () => Promise<gmail_v1.Schema$Label[]>;
  sendMessage: (to: string, subject: string, body: string) => Promise<void>;
}
