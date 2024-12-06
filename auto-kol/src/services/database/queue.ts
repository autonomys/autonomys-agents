import { QueuedResponse, ApprovalAction, SkippedTweet } from '../../types/queue.js';
import { createLogger } from '../../utils/logger.js';
import {
    addPendingResponse,
    getPendingResponses,
    updateResponseStatus,
    addSkippedTweet,
    getSkippedTweets,
    addTweet,
    updateTweetEngagementStatus,
    addSendResponse
} from '../../database/index.js';
import { v4 as generateId } from 'uuid';

const logger = createLogger('database-queue');
const isUniqueConstraintError = (error: any): boolean => {
    return error?.code === 'SQLITE_CONSTRAINT' && 
           error?.message?.includes('UNIQUE constraint failed');
};


export async function addToQueue(response: QueuedResponse): Promise<void> {
    try {
        // First add the tweet
        try {
            await addTweet({
                id: response.tweet.id,
                authorId: response.tweet.authorId,
                authorUsername: response.tweet.authorUsername,
                content: response.tweet.text,
                createdAt: response.tweet.createdAt
            });
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                logger.warn(`Tweet already exists: ${response.tweet.id}`);
            } else {
                throw error;
            }
        }
       
        await addPendingResponse({
            id: response.id,
            tweetId: response.tweet.id,
            content: response.response.content,
            tone: response.workflowState.toneAnalysis?.suggestedTone || 'neutral',
            strategy: response.workflowState.responseStrategy?.strategy || 'direct',
            estimatedImpact: response.workflowState.responseStrategy?.estimatedImpact || 5,
            confidence: response.workflowState.responseStrategy?.confidence || 0.5
        });

        logger.info(`Added response to queue: ${response.id}`);
    } catch (error) {
        logger.error('Failed to add response to queue:', error);
        throw error;
    }
}

export async function addToSkipped(skipped: SkippedTweet): Promise<void> {
    try {
        // First add the tweet
        try {
            await addTweet({
                id: skipped.tweet.id,
                authorId: skipped.tweet.authorId,
                authorUsername: skipped.tweet.authorUsername,
                content: skipped.tweet.text,
                createdAt: skipped.tweet.createdAt
            });
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                logger.warn(`Tweet already exists: ${skipped.tweet.id}`);
            } else {
                throw error;
            }
        }

        // Then add the skipped record
        await addSkippedTweet({
            id: skipped.id,
            tweetId: skipped.tweet.id,
            reason: skipped.reason,
            confidence: skipped.workflowState.responseStrategy?.confidence || 0.5
        });

        // Update tweet status
        await updateTweetEngagementStatus(skipped.tweet.id, 'skipped');

        logger.info(`Added tweet to skipped: ${skipped.id}`);
    } catch (error) {
        logger.error('Failed to add skipped tweet:', error);
        throw error;
    }
}

export async function getAllPendingResponses(): Promise<QueuedResponse[]> {
    try {
        const responses = await getPendingResponses();
        return responses.map(r => ({
            id: r.id,
            tweet: {
                id: r.tweet_id,
                authorUsername: r.author_username,
                text: r.tweet_content,
                authorId: '', // Will need to be added to the query
                createdAt: r.created_at
            },
            response: {
                content: r.content
            },
            status: r.status as 'pending' | 'approved' | 'rejected',
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
            workflowState: {
                toneAnalysis: {
                    suggestedTone: r.tone
                },
                engagementDecision: {
                    reason: r.strategy,
                    priority: r.estimated_impact
                }
            } as any
        }));
    } catch (error) {
        logger.error('Failed to get pending responses:', error);
        throw error;
    }
}

export async function updateResponseApproval(
    action: ApprovalAction,
    tweetId: string,
    responseId: string
): Promise<void> {
    try {
        await updateResponseStatus(
            action.id,
            action.approved ? 'approved' : 'rejected',
            action.feedback
        );
        await addSendResponse({
            id: action.id,
            tweetId,
            responseId
        });
        logger.info(`Updated response status: ${action.id}`);
    } catch (error) {
        logger.error('Failed to update response status:', error);
        throw error;
    }
} 