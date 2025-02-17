import { createAutoDriveApi } from '@autonomys/auto-drive';
import { config } from '../../config/index.js';

export const autoDriveApi = createAutoDriveApi({
  apiKey: config.autoDriveConfig.AUTO_DRIVE_API_KEY || '',
  network: config.autoDriveConfig.AUTO_DRIVE_NETWORK,
});
