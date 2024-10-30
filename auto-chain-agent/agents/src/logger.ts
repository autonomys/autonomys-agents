import winston from 'winston';
import { config } from './config';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({
            filename: 'error.log',
            level: 'error',
            format: winston.format.json()
        }),
        new winston.transports.File({
            filename: 'combined.log',
            format: winston.format.json()
        })
    ]
});

if (config.environment !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} [${level}]: ${message}`;
            })
        )
    }));
}

export default logger; 