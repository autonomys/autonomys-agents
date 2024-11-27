import winston from 'winston';
import { config } from '../config';

const createFormat = () =>
    winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    );

const createTransports = () => [
    new winston.transports.File({
        filename: 'error.log',
        level: 'error'
    }),
    new winston.transports.File({
        filename: 'combined.log'
    })
];

const addConsoleTransport = (logger: winston.Logger): winston.Logger => {
    if (config.NODE_ENV !== 'production') {
        logger.add(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        );
    }
    return logger;
};

export const createLogger = (context: string) => {
    const logger = winston.createLogger({
        defaultMeta: { context },
        level: 'info',
        format: createFormat(),
        transports: createTransports()
    });

    return addConsoleTransport(logger);
}; 