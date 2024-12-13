import express from 'express';
import cors from 'cors';
import { getAllDsn, getMemoryByCid, saveMemoryRecord } from './db/index.js';
import { downloadMemory } from './utils/dsn.js';

const app = express();
const port = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());


app.get('/memories', async (req: any, res: any) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({ 
                error: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100' 
            });
        }

        const dsnRecords = await getAllDsn(page, limit);
        res.json(dsnRecords);
    } catch (error) {
        console.error('Error fetching DSN records:', error);
        res.status(500).json({ error: 'Failed to fetch DSN records' });
    }
});

app.get('/memories/:cid', async (req: any, res: any) => {
    try {
        const { cid } = req.params;        
        let memory = await getMemoryByCid(cid);
        
        if (!memory) {
            const memoryData = await downloadMemory(cid);
            await saveMemoryRecord(cid, memoryData, memoryData?.previous_cid);
            memory = await getMemoryByCid(cid);
        }

        res.json(memory?.content);
    } catch (error) {
        console.error('Error fetching memory:', error);
        res.status(500).json({ error: 'Failed to fetch memory' });
    }
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});



export default app;
