import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import fs from 'fs';
import path from 'path';
import logger from '../../logger';
import { initializeDb } from './db';
import { SummaryDifference } from './interface';
import { uploadFile } from '../utils';
import { config } from '../../config';

const createMessage = (type: 'human' | 'ai', content: string) =>
    type === 'human' ? new HumanMessage({ content }) : new AIMessage({ content });

export const serializeMessage = (msg: BaseMessage) => ({
    _type: msg._getType(),
    content: msg.content,
    additional_kwargs: msg.additional_kwargs
});

export const deserializeMessage = (msg: any) => {
    if (!msg) return createMessage('ai', 'Invalid message');
    return createMessage(
        msg._type === 'human' ? 'human' : 'ai',
        msg.content
    );
};


export  const saveDiffFile = async (differences: SummaryDifference[]) => {
    try {
        // Create diffs directory if it doesn't exist
        if (!fs.existsSync(config.SUMMARY_DIR)) {
            fs.mkdirSync(config.SUMMARY_DIR, { recursive: true });
        }

        const db = await initializeDb(path.join(process.cwd(), 'thread-storage.sqlite'));
        const lastUpload = await db.get(
            'SELECT CID FROM summary_uploads ORDER BY timestamp DESC LIMIT 1'
        );

        const differencesWithPrevCID = differences.map(diff => ({
            ...diff,
            previousCID: lastUpload?.CID || null
        }));

        // Generate unique filename based on timestamp
        const timestamp = new Date().getTime();
        const diffFileName = `${config.DIFF_FILE_PREFIX}${timestamp}.json`;
        const diffFilePath = path.join(config.SUMMARY_DIR, diffFileName);

        await fs.promises.writeFile(
            diffFilePath,
            JSON.stringify(differencesWithPrevCID, null, 2),
            'utf8'
        );

        // Upload the diff file
        const fileBuffer = await fs.promises.readFile(diffFilePath);
        const uploadResult = await uploadFile(fileBuffer, diffFileName);

        await db.run(
            'INSERT INTO summary_uploads (upload_id, CID) VALUES (?, ?)',
            [uploadResult.upload_id, uploadResult.completion.cid]
        );

        logger.info(`Diff file uploaded successfully with ID: ${uploadResult.upload_id}`);
        return diffFileName;
    } catch (error) {
        logger.error('Error saving diff file:', error);
        throw error;
    }
};
