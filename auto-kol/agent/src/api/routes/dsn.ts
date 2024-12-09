import { Router } from 'express';
import { createLogger } from '../../utils/logger.js';
import { getAllDsn, getDsnByCID } from '../../database/index.js';
import { inflate } from 'pako';
import { createAutoDriveApi, downloadObject } from '@autonomys/auto-drive';
import { config } from '../../config/index.js';
const router = Router();
const logger = createLogger('dsn-api');

router.get('/memories', async (_, res) => {
    try {
        const dsnRecords = await getAllDsn();
        res.json(dsnRecords);
    } catch (error) {
        logger.error('Error fetching DSN records:', error);
        res.status(500).json({ error: 'Failed to fetch DSN records' });
    }
});

router.get('/memories/:cid', async (req, res) => {
    try {
        const api = createAutoDriveApi({ 
            apiKey: config.DSN_API_KEY || '' 
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