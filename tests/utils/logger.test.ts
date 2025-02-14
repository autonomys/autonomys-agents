import { createLogger } from '../../src/utils/logger';
import winston from 'winston';

jest.mock('winston', () => ({
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    uncolorize: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
  createLogger: jest.fn().mockReturnValue({
    add: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a logger with default parameters', () => {
    const _logger = createLogger('test-context');

    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.transports.Console).toHaveBeenCalled();
    expect(winston.transports.File).toHaveBeenCalledTimes(2);
  });

  it('should create a logger with custom folder and file names', () => {
    const _logger = createLogger(
      'test-context',
      'custom-logs',
      'custom-error.log',
      'custom-combined.log',
    );

    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.transports.File).toHaveBeenCalledTimes(2);
    expect(winston.transports.File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: expect.stringContaining('custom-error.log'),
      }),
    );
  });

  it('should log messages at different levels', () => {
    const logger = createLogger('test-context');

    logger.info('test info message');
    logger.error('test error message');
    logger.warn('test warning message');

    expect(logger.info).toHaveBeenCalledWith('test info message');
    expect(logger.error).toHaveBeenCalledWith('test error message');
    expect(logger.warn).toHaveBeenCalledWith('test warning message');
  });
});
