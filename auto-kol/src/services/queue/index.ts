import { QueuedResponse, ApprovalAction } from '../../types/queue';
import { createLogger } from '../../utils/logger';

const logger = createLogger('response-queue');

// In-memory queue for simplicity. Could be replaced with Redis/DB
const responseQueue = new Map<string, QueuedResponse>();

export const addToQueue = (response: QueuedResponse): void => {
    responseQueue.set(response.id, response);
    logger.info(`Added response to queue: ${response.id}`);
};

export const getQueuedResponse = (id: string): QueuedResponse | undefined =>
    responseQueue.get(id);

export const getAllPendingResponses = (): readonly QueuedResponse[] =>
    Array.from(responseQueue.values())
        .filter(response => response.status === 'pending');

export const updateResponseStatus = (
    action: ApprovalAction
): QueuedResponse | undefined => {
    const response = responseQueue.get(action.id);
    if (!response) return undefined;

    const updatedResponse = {
        ...response,
        status: action.approved ? 'approved' : 'rejected',
        updatedAt: new Date()
    } satisfies QueuedResponse;

    responseQueue.set(action.id, updatedResponse);
    return updatedResponse;
}; 