import { QueuedResponseMemory, ApprovalAction, SkippedTweetMemory, ActionResponse } from '../../types/queue.js';
import { createLogger } from '../../utils/logger.js';
import * as db from '../database/index.js';
import { ChromaService } from '../vectorstore/chroma.js';
import { getPendingResponsesByTweetId, getResponseByTweetId, getTweetById } from '../../database/index.js';
import { Tweet } from '../../types/twitter.js';
import { v4 as generateId } from 'uuid';
const logger = createLogger('response-queue');

// In-memory queues
const responseQueueMemory = new Map<string, QueuedResponseMemory>();
const skippedTweetsMemory = new Map<string, SkippedTweetMemory>();

export const addToQueueMemory = async (response: QueuedResponseMemory): Promise<void> => {
    try {
        responseQueueMemory.set(response.id, response);
        await db.addToQueue(response);
        logger.info(`Added response to queue: ${response.id}`);
    } catch (error) {
        logger.error('Failed to add response to queue:', error);
    }
};

export const addToSkippedMemory = async (skipped: SkippedTweetMemory): Promise<void> => {
    try {
        skippedTweetsMemory.set(skipped.id, skipped);
        await db.addToSkipped(skipped);
        logger.info(`Added tweet to skipped: ${skipped.id}`);
    } catch (error) {
        logger.error('Failed to add tweet to skipped:', error);
    }
};

export const getQueuedResponseMemory = (id: string): QueuedResponseMemory | undefined =>
    responseQueueMemory.get(id);

export const getSkippedTweetMemory = (id: string): SkippedTweetMemory | undefined =>
    skippedTweetsMemory.get(id);

export const getAllSkippedTweetsMemory = (): readonly SkippedTweetMemory[] =>
    Array.from(skippedTweetsMemory.values());


// Optional: Add ability to move skipped tweet to queue
export const moveToQueueMemory = async (
    skippedId: string,
    queuedResponse: Omit<QueuedResponseMemory, 'status'> & { status: 'pending' }
): Promise<void> => {
    try {
        const skipped = skippedTweetsMemory.get(skippedId);
        if (!skipped) {
            throw new Error('Skipped tweet not found');
        }

        const typedResponse: QueuedResponseMemory = {
            ...queuedResponse,
            status: 'pending'
        };

        await addToQueueMemory(typedResponse);
        skippedTweetsMemory.delete(skippedId);
        logger.info(`Moved skipped tweet ${skippedId} to response queue`);
    } catch (error) {
        logger.error('Failed to move skipped tweet to queue:', error);
    }
};
