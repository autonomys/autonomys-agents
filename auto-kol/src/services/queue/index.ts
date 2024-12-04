import { QueuedResponse, ApprovalAction, SkippedTweet } from '../../types/queue';
import { createLogger } from '../../utils/logger';

const logger = createLogger('response-queue');

// In-memory queues
const responseQueue = new Map<string, QueuedResponse>();
const skippedTweets = new Map<string, SkippedTweet>();

export const addToQueue = (response: QueuedResponse): void => {
    responseQueue.set(response.id, response);
    logger.info(`Added response to queue: ${response.id}`);
};

export const addToSkipped = (skipped: SkippedTweet): void => {
    skippedTweets.set(skipped.id, skipped);
    logger.info(`Added tweet to skipped: ${skipped.id}`);
};

export const getQueuedResponse = (id: string): QueuedResponse | undefined =>
    responseQueue.get(id);

export const getSkippedTweet = (id: string): SkippedTweet | undefined =>
    skippedTweets.get(id);

export const getAllPendingResponses = (): readonly QueuedResponse[] =>
    Array.from(responseQueue.values())
        .filter(response => response.status === 'pending');

export const getAllSkippedTweets = (): readonly SkippedTweet[] =>
    Array.from(skippedTweets.values());

export const updateResponseStatus = (
    action: ApprovalAction
): QueuedResponse | undefined => {
    const response = responseQueue.get(action.id);
    if (!response) return undefined;

    const updatedResponse: QueuedResponse = {
        ...response,
        status: action.approved ? ('approved' as const) : ('rejected' as const),
        updatedAt: new Date()
    };

    responseQueue.set(action.id, updatedResponse);
    return updatedResponse;
};

// Optional: Add ability to move skipped tweet to queue
export const moveToQueue = async (
    skippedId: string,
    queuedResponse: Omit<QueuedResponse, 'status'> & { status: 'pending' }
): Promise<void> => {
    const skipped = skippedTweets.get(skippedId);
    if (!skipped) {
        throw new Error('Skipped tweet not found');
    }

    const typedResponse: QueuedResponse = {
        ...queuedResponse,
        status: 'pending'
    };

    addToQueue(typedResponse);
    skippedTweets.delete(skippedId);
    logger.info(`Moved skipped tweet ${skippedId} to response queue`);
}; 