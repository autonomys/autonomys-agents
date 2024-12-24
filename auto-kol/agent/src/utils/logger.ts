import winston from 'winston';
import { config } from '../config/index.js';
import util from 'util';

const formatMeta = (meta: any, useColors: boolean = false) => {
  const cleanMeta = Object.entries(meta)
    .filter(([key]) => !key.startsWith('Symbol(') && key !== 'splat')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  if (Object.keys(cleanMeta).length === 0) return '';

  if (meta[Symbol.for('splat')]?.[0]) {
    Object.assign(cleanMeta, meta[Symbol.for('splat')][0]);
  }

  return Object.keys(cleanMeta).length ? '\n' + JSON.stringify(cleanMeta, null, 2) : '';
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
    winston.format.colorize({ level: true }),
    winston.format.printf(({ level, message, context, timestamp, ...meta }) => {
      const metaStr = formatMeta(meta, true);
      const paddedLevel = level.toUpperCase().padEnd(7);
      return `${timestamp} | ${paddedLevel} | [${context}] | ${message}${metaStr}`;
    }),
  );

const createTransports = () => [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: createFileFormat(),
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: createFileFormat(),
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  }),
];

const addConsoleTransport = (logger: winston.Logger): winston.Logger => {
  if (config.NODE_ENV !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: createConsoleFormat(),
      }),
    );
  }
  return logger;
};

export const createLogger = (context: string) => {
  const logger = winston.createLogger({
    defaultMeta: { context },
    level: 'info',
    format: createFileFormat(),
    transports: createTransports(),
  });

  return addConsoleTransport(logger);
};
