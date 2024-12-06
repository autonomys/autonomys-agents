import { QueuedResponse, ApprovalAction, SkippedTweet } from '../../types/queue.js';
import { createLogger } from '../../utils/logger.js';
import * as db from '../database/index.js';
import { ChromaService } from '../vectorstore/chroma.js';
import { getPendingResponsesByTweetId } from '../../database/index.js';
const logger = createLogger('response-queue');

// In-memory queues
const responseQueue = new Map<string, QueuedResponse>();
const skippedTweets = new Map<string, SkippedTweet>();

export const addToQueue = async (response: QueuedResponse): Promise<void> => {
    try {
        responseQueue.set(response.id, response);
        await db.addToQueue(response);
        logger.info(`Added response to queue: ${response.id}`);
    } catch (error) {
        logger.error('Failed to add response to queue:', error);
    }
};

export const addToSkipped = async (skipped: SkippedTweet): Promise<void> => {
    try {
        skippedTweets.set(skipped.id, skipped);
        await db.addToSkipped(skipped);
        logger.info(`Added tweet to skipped: ${skipped.id}`);
    } catch (error) {
        logger.error('Failed to add tweet to skipped:', error);
    }
};

export const getQueuedResponse = (id: string): QueuedResponse | undefined =>
    responseQueue.get(id);

export const getSkippedTweet = (id: string): SkippedTweet | undefined =>
    skippedTweets.get(id);

export const getAllPendingResponses = async (): Promise<readonly QueuedResponse[]> => {
    try {
        const responses = await db.getAllPendingResponses();
        // Update in-memory queue with database results
        responses.forEach(response => {
            responseQueue.set(response.id, response);
        });
        return responses;
    } catch (error) {
        logger.error('Failed to get pending responses:', error);
        return [];
    }
};

export const getAllSkippedTweets = (): readonly SkippedTweet[] =>
    Array.from(skippedTweets.values());



export const updateResponseStatus = async (
    action: ApprovalAction
): Promise<QueuedResponse | undefined> => {
    try {
        const response = await getPendingResponsesByTweetId(action.tweetId);
        if (!response) return undefined;

        await db.updateResponseApproval(action);
        // If rejected, remove from vector store
        if (!action.approved) {
            const chromaService = await ChromaService.getInstance();
            await chromaService.deleteTweet(action.tweetId);
        }

    } catch (error) {
        logger.error('Failed to update response status:', error);
        return undefined;
    }
};

// Optional: Add ability to move skipped tweet to queue
export const moveToQueue = async (
    skippedId: string,
    queuedResponse: Omit<QueuedResponse, 'status'> & { status: 'pending' }
): Promise<void> => {
    try {
        const skipped = skippedTweets.get(skippedId);
        if (!skipped) {
            throw new Error('Skipped tweet not found');
        }

        const typedResponse: QueuedResponse = {
            ...queuedResponse,
            status: 'pending'
        };

        await addToQueue(typedResponse);
        skippedTweets.delete(skippedId);
        logger.info(`Moved skipped tweet ${skippedId} to response queue`);
    } catch (error) {
        logger.error('Failed to move skipped tweet to queue:', error);
    }
};
