import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { getAllDsn } from '../../database/index.js';
import { inflate } from 'pako';
import { createAutoDriveApi, downloadObject } from '@autonomys/auto-drive';
import { config } from '../../config/index.js';
const router = Router();
const logger = createLogger('dsn-api');

router.get('/memories', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error:
          'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100',
      });
    }

    const dsnRecords = await getAllDsn(page, limit);
    res.json(dsnRecords);
  } catch (error) {
    logger.error('Error fetching DSN records:', error);
    res.status(500).json({ error: 'Failed to fetch DSN records' });
  }
});

router.get('/memories/:cid', async (req, res) => {
  try {
    const api = createAutoDriveApi({
      apiKey: config.DSN_API_KEY || '',
    });

    const stream = await downloadObject(api, { cid: req.params.cid });
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    const decompressed = inflate(allChunks);
    const jsonString = new TextDecoder().decode(decompressed);
    const memoryData = JSON.parse(jsonString);
    res.json(memoryData);
  } catch (error) {
    logger.error('Error fetching memory data:', error);
    res.status(500).json({ error: 'Failed to fetch memory data' });
  }
});

export default router;
