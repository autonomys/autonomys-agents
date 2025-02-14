import winston from 'winston';
import { config } from '../config/index.js';
import util from 'util';

const formatMeta = (meta: any) => {
  const cleanMeta = Object.entries(meta)
    .filter(([key]) => !key.startsWith('Symbol(') && key !== 'splat')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  if (Object.keys(cleanMeta).length === 0) return '';

  if (meta[Symbol.for('splat')]?.[0]) {
    Object.assign(cleanMeta, meta[Symbol.for('splat')][0]);
  }

  return Object.keys(cleanMeta).length
    ? '\n' +
        util.inspect(cleanMeta, {
          colors: true,
          depth: 4,
          compact: false,
          breakLength: 80,
        })
    : '';
};

const createFormat = () =>
  winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, context, timestamp, ...meta }) => {
      const metaStr = formatMeta(meta);
      return `${timestamp} [${context}] ${level}: ${message}${metaStr}`;
    }),
  );

const createTransports = () => [
  new winston.transports.File({
    filename: 'error.log',
    level: 'error',
  }),
  new winston.transports.File({
    filename: 'combined.log',
  }),
];

const addConsoleTransport = (logger: winston.Logger): winston.Logger => {
  if (config.NODE_ENV !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ level: true }),
          winston.format.printf(({ level, message, context, timestamp, ...meta }) => {
            const metaStr = formatMeta(meta);
            return `\x1b[32m${timestamp} [${context}]\x1b[0m ${level}: ${message}${metaStr}`;
          }),
        ),
      }),
    );
  }
  return logger;
};

export const createLogger = (context: string) => {
  const logger = winston.createLogger({
    defaultMeta: { context },
    level: 'info',
    format: createFormat(),
    transports: createTransports(),
  });

  return addConsoleTransport(logger);
};
