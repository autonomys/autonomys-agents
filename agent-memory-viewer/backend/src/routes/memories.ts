import { Router } from 'express';
import { getAllDsn, getMemoryByCid, saveMemoryRecord } from '../db/index.js';
import { downloadMemory } from '../utils/dsn.js';
import { createLogger } from '../utils/logger.js';
import { processPreviousCids } from '../utils/backgroundProcessor.js';

const router = Router();
const logger = createLogger('memories-router');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchText = req.query.search as string | undefined;
    const authorUsername = req.query.author as string | undefined;
    const agent = req.query.agent as string | undefined;

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        error:
          'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100',
      });
      return;
    }

    const dsnRecords = await getAllDsn(page, limit, searchText, authorUsername, agent);

    if (!dsnRecords.data || dsnRecords.data.length === 0) {
      res.json({
        data: [],
        pagination: {
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0,
        },
        message: 'No memory found',
      });
      return;
    }

    res.json(dsnRecords);
  } catch (error) {
    logger.error('Error fetching DSN records:', error);
    res.status(500).json({ error: 'Failed to fetch DSN records' });
  }
});

router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    let memory = await getMemoryByCid(cid);
    if (!memory) {
      const memoryResult = await downloadMemory(cid);
      console.log('agentName', memoryResult?.agentName);
      if (!memoryResult?.memoryData) {
        res.status(404).json({ error: 'Memory not found' });
        return;
      }
      console.log('saving memory record');
      await saveMemoryRecord(
        cid,
        memoryResult?.memoryData,
        memoryResult?.memoryData?.previousCid,
        memoryResult?.agentName,
      );
      memory = await getMemoryByCid(cid);
      processPreviousCids(memoryResult?.memoryData?.previousCid, memoryResult?.agentName);
    }

    res.json({
      ...memory?.content,
      agent_name: memory?.agent_name,
    });
  } catch (error) {
    logger.error('Error fetching memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

export default router;
