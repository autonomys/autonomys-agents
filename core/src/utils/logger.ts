import winston from 'winston';
import path from 'path';
import util from 'util';
import fs from 'fs';
import { getWorkspacePath } from './paths.js';
import { getCharacterName } from './args.js';

const getDefaultLogPath = () => {
  const workspacePath = getWorkspacePath();
  const characterName = getCharacterName();
  const logPath = path.join(workspacePath, 'characters', characterName);

  // Ensure the logs directory exists
  try {
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating logs directory:', error);
  }
  return logPath;
};

const stripAnsi = (str: string) => str.replace(/\u001b\[\d+m/g, '');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatMeta = (meta: any, _useColors: boolean = false) => {
  const cleanMeta = Object.entries(meta)
    .filter(([key]) => !key.startsWith('Symbol(') && key !== 'splat')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  if (Object.keys(cleanMeta).length === 0) return '';

  if (meta[Symbol.for('splat')]?.[0]) {
    Object.assign(cleanMeta, meta[Symbol.for('splat')][0]);
  }

  return Object.keys(cleanMeta).length
    ? `\n${util.inspect(cleanMeta, {
        depth: 5,
        colors: _useColors,
        maxStringLength: Infinity,
        breakLength: 80,
        compact: false,
      })}`
    : '';
};

const createFileFormat = () =>
  winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.uncolorize(),
    winston.format.printf(({ level, message, context, timestamp, ...meta }) => {
      const metaStr = formatMeta(meta, false);
      const paddedLevel = level.toUpperCase().padEnd(7);
      return `${timestamp} | ${paddedLevel} | [${context}] | ${message}${metaStr}`;
    }),
  );

const createConsoleFormat = () =>
  winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.printf(({ level, message, context, timestamp, ...meta }) => {
      const metaStr = formatMeta(meta, true);
      const paddedLevel = stripAnsi(level.toUpperCase().padEnd(7));
      return `${timestamp} | ${paddedLevel} | [${context}] | ${stripAnsi(String(message))}${metaStr}`;
    }),
  );

const createTransports = (folder: string, errorLogs: string, combinedLogs: string) => [
  new winston.transports.File({
    filename: path.join(folder, errorLogs),
    level: 'error',
    format: createFileFormat(),
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(folder, combinedLogs),
    format: createFileFormat(),
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  }),
];

interface LoggerOptions {
  context: string;
  folder?: string;
  errorLogs?: string;
  combinedLogs?: string;
  isProduction?: boolean;
  basePath?: string;
}

type LoggerParams = [LoggerOptions] | [string, string?, string?, string?];

export const createLogger = (...args: LoggerParams): winston.Logger => {
  const defaultBasePath = getDefaultLogPath();
  const isProduction = process.env.NODE_ENV === 'production';

  if (typeof args[0] === 'object') {
    const {
      context,
      folder = 'logs',
      errorLogs = 'error.log',
      combinedLogs = 'combined.log',
      isProduction: optionsIsProduction = isProduction,
      basePath = defaultBasePath,
    } = args[0];

    const logFolder = path.join(basePath, folder);
    // Ensure log directory exists
    try {
      fs.mkdirSync(logFolder, { recursive: true });
    } catch (error) {
      console.error(`Error creating log directory ${logFolder}:`, error);
    }

    const logger = winston.createLogger({
      defaultMeta: { context },
      level: 'info',
      format: createFileFormat(),
      transports: createTransports(logFolder, errorLogs, combinedLogs),
    });

    if (!optionsIsProduction) {
      logger.add(
        new winston.transports.Console({
          format: createConsoleFormat(),
        }),
      );
    }

    return logger;
  }

  const [context, folder = 'logs', errorLogs = 'error.log', combinedLogs = 'combined.log'] = args;
  const logFolder = path.join(defaultBasePath, folder);
  // Ensure log directory exists
  try {
    fs.mkdirSync(logFolder, { recursive: true });
  } catch (error) {
    console.error(`Error creating log directory ${logFolder}:`, error);
  }

  const logger = winston.createLogger({
    defaultMeta: { context },
    level: 'info',
    format: createFileFormat(),
    transports: createTransports(logFolder, errorLogs, combinedLogs),
  });

  if (!isProduction) {
    logger.add(
      new winston.transports.Console({
        format: createConsoleFormat(),
      }),
    );
  }

  return logger;
};
