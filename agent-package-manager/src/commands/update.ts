import { UpdateOptions } from '../types/index.js';
import checkForUpdates from '../utils/update/index.js';

/**
 * Check for updates to the agent-os CLI
 * @param options Update command options
 */
export const update = async (options: UpdateOptions): Promise<void> => {
  const _checkForUpdates = await checkForUpdates(options);
};
