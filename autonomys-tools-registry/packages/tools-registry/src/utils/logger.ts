import chalk from 'chalk';

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

export function createLogger(context: string) {
  const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const coloredLevel = {
      info: chalk.blue('INFO'),
      error: chalk.red('ERROR'),
      warn: chalk.yellow('WARN'),
      debug: chalk.gray('DEBUG'),
    }[level];

    console.log(
      `${chalk.gray(timestamp)} ${coloredLevel} [${chalk.green(context)}] ${message}`,
      ...args
    );
  };

  return {
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
  };
} 