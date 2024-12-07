import { QueuedResponse, ApprovalAction, SkippedTweet } from '../../types/queue.js';
import { createLogger } from '../../utils/logger.js';
import * as db from '../../database/index.js';
import { v4 as generateId } from 'uuid';
import { Tweet } from '../../types/twitter.js';

const logger = createLogger('database-queue');
const isUniqueConstraintError = (error: any): boolean => {
    return error?.code === 'SQLITE_CONSTRAINT' && 
           error?.message?.includes('UNIQUE constraint failed');
};

export async function addToQueue(response: QueuedResponse): Promise<void> {
    try {
        // First add the tweet
        try {
            await db.addTweet({
                id: response.tweet.id,
                author_id: response.tweet.author_id,
                author_username: response.tweet.author_username,
                content: response.tweet.text,
                created_at: response.tweet.created_at
            });
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                logger.warn(`Tweet already exists: ${response.tweet.id}`);
            } else {
                throw error;
            }
        }
       
        await db.addPendingResponse({
            id: response.id,
            tweet_id: response.tweet.id,
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
            await db.addTweet({
                id: skipped.tweet.id,
                author_id: skipped.tweet.author_id,
                author_username: skipped.tweet.author_username,
                content: skipped.tweet.text,
                created_at: skipped.tweet.created_at
            });
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                logger.warn(`Tweet already exists: ${skipped.tweet.id}`);
            } else {
                throw error;
            }
        }

        // Then add the skipped record
        await db.addSkippedTweet({
            id: skipped.id,
            tweetId: skipped.tweet.id,
            reason: skipped.reason,
            confidence: skipped.workflowState.responseStrategy?.confidence || 0.5
        });

        // Update tweet status
        await db.updateTweetEngagementStatus(skipped.tweet.id, 'skipped');

        logger.info(`Added tweet to skipped: ${skipped.id}`);
    } catch (error) {
        logger.error('Failed to add skipped tweet:', error);
        throw error;
    }
}

export async function getAllPendingResponses(): Promise<QueuedResponse[]> {
    try {
        const responses = await db.getPendingResponses();
        return responses.map(r => ({
            id: r.id,
            tweet: {
                id: r.tweet_id,
                author_username: r.author_username,
                text: r.tweet_content,
                author_id: '', // Will need to be added to the query
                created_at: r.created_at
            },
            response: {
                content: r.content
            },
            status: r.status as 'pending' | 'approved' | 'rejected',
            created_at: new Date(r.created_at),
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
    tweet: any,
    sendResponseId: string
): Promise<void> {
    try {
        await db.updateResponseStatus(
            action.id,
            action.approved ? 'approved' : 'rejected',
            action.feedback
        );
        await db.addSendResponse({
            id: sendResponseId,
            tweetId: tweet.tweet_id,
            responseId: action.id
        });
        logger.info(`Updated response status: ${action.id}`);
    } catch (error) {
        logger.error('Failed to update response status:', error);
        throw error;
    }
} 

export async function isTweetExists(tweetId: string): Promise<boolean> {
    const tweet = await db.getTweetById(tweetId);
    return tweet !== undefined;
}
