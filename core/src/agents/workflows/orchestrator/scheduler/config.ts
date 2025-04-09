import { join } from 'path';

export const schedulerConfig = (path: string) => {
  const dbPath = join(path, 'data', 'scheduler.db');
  return {
    dbPath,
  };
};
