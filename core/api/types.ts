import { Express } from 'express';
import { Server } from 'http';
import { Logger } from 'winston';
import { Http2SecureServer } from 'http2';

export interface ApiServer {
  app: Express;
  server: Server | Http2SecureServer;
  broadcastLog: (namespace: string, level: string, message: string, meta?: LogMetadata) => void;
  broadcastTaskUpdate: (namespace: string) => void;
  attachLogger: (logger: Logger, namespace: string) => Logger;
  getRegisteredNamespaces: () => string[];
  broadcastNamespaces: () => void;
}

export interface LogMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | number | boolean | null | undefined | object | any[];
}
