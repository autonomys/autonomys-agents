import { QueuedResponseMemory, ApprovalAction, SkippedTweetMemory, ActionResponse, QueuedTweet } from '../../types/queue.js';
import { createLogger } from '../../utils/logger.js';
import * as db from '../../database/index.js';
import { getPendingResponsesByTweetId } from '../../database/index.js';
import { getTweetById } from '../../database/index.js';


const logger = createLogger('database-queue');
export interface DbTweet {
    id: string;
    text: string;
    user_id: string;
    username: string;
    time_parsed: Date;
}

const convertQueuedTweetToDbTweet = (tweet: QueuedTweet): DbTweet => {
    if (!tweet.id || !tweet.text || !tweet.userId || !tweet.username || !tweet.timeParsed) {
        throw new Error('Required tweet fields missing');
    }

    return {
        id: tweet.id,
        text: tweet.text,
        user_id: tweet.userId,
        username: tweet.username,
        time_parsed: new Date(tweet.timeParsed)
    };
}

const convertDbTweetToQueuedTweet = (tweet: DbTweet): QueuedTweet => {

    return {
        id: tweet.id,
        text: tweet.text,
        userId: tweet.user_id,
        username: tweet.username,
        timeParsed: tweet.time_parsed
    };
}
///////////RESPONSE///////////
export async function addResponse(response: QueuedResponseMemory): Promise<void> {
    const dbTweet = convertQueuedTweetToDbTweet(response.tweet);
    try {
        try {
            await db.addTweet(dbTweet);
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                logger.warn(`Tweet already exists: ${response.tweet.id}`);
            } else {
                throw error;
            }
        }
        await db.addResponse({
            id: response.id,
            tweet_id: dbTweet.id,
            content: response.response.content,
            tone: response.workflowState.toneAnalysis?.suggestedTone || 'neutral',
            strategy: response.workflowState.responseStrategy?.strategy || 'direct',
            estimatedImpact: response.workflowState.responseStrategy?.estimatedImpact || 5,
            confidence: response.workflowState.responseStrategy?.confidence || 0.5
        });
    } catch (error) {
        logger.error('Failed to add response to queue:', error);
        throw error;
    }
}


export const updateResponseStatus = async (
    action: ApprovalAction
): Promise<ActionResponse | undefined> => {
    try {
        const pendingResponse = await getPendingResponsesByTweetId(action.id);
        const tweet = await getTweetById(pendingResponse.tweet_id);
        await db.updateResponseStatus(
            action.id,
            action.approved ? 'approved' : 'rejected',
        );
        logger.info(`Updated response status: ${action.id}`);

        return {
            tweet: convertDbTweetToQueuedTweet(tweet!),
            status: action.approved ? 'approved' : 'rejected',
            response: pendingResponse as unknown as ActionResponse['response'],
        }
    } catch (error) {
        logger.error('Failed to update response status:', error);
        return undefined;
    }
};

export async function getAllPendingResponses(): Promise<QueuedResponseMemory[]> {
    try {
        const responses = await db.getPendingResponses();
        return responses.map(r => ({
            id: r.id,
            tweet: convertDbTweetToQueuedTweet(r),
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

///////////SKIPPED TWEETS///////////
export async function addToSkipped(skipped: SkippedTweetMemory): Promise<void> {
    try {
        try {
            const dbTweet = convertQueuedTweetToDbTweet(skipped.tweet);
            await db.addTweet(dbTweet);
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                logger.warn(`Tweet already exists: ${skipped.tweet.id}`);
            } else {
                throw error;
            }
        }
        await db.addSkippedTweet({
            id: skipped.id,
            tweetId: skipped.tweet.id,
            reason: skipped.reason,
            confidence: skipped.workflowState.decision?.confidence || 0
        });

        logger.info(`Added tweet to skipped: ${skipped.id}`);
    } catch (error) {
        logger.error('Failed to add skipped tweet:', error);
        throw error;
    }
}

export async function getSkippedTweets(): Promise<SkippedTweetMemory[]> {
    const skipped = await db.getSkippedTweets();
    return skipped;
}

export async function getSkippedTweetById(skippedId: string): Promise<SkippedTweetMemory> {
    const skipped = await db.getSkippedTweetById(skippedId);
    const tweet = await getTweetById(skipped.tweet_id);

    if (!skipped || !tweet) {
        throw new Error('Skipped tweet or original tweet not found');
    }
    const result: SkippedTweetMemory = {
        id: skipped.id,
        tweet: convertDbTweetToQueuedTweet(tweet),
        reason: skipped.reason,
        priority: skipped.priority,
        created_at: new Date(),
        workflowState: {
            tweet: tweet,
            messages: [],
            previousInteractions: [],
            engagementDecision: {
                shouldEngage: false,
                reason: skipped.reason,
                priority: skipped.priority
            }
        }
    };

    return result;
}

export const moveSkippedToQueue = async (
    skippedId: string,
    queuedResponse: Omit<QueuedResponseMemory, 'status'> & { status: 'pending' }
): Promise<QueuedResponseMemory> => {
    try {
        const skipped = await getSkippedTweetById(skippedId) as any;
        logger.info(`Skipped tweet: ${JSON.stringify(skipped)}`);

        if (!skipped) {
            throw new Error('Skipped tweet not found');
        }
        const tweet = await db.getTweetById(skipped.tweet_id);
        if (!tweet) {
            throw new Error('Tweet not found');
        }
        logger.info(`Tweet: ${JSON.stringify(tweet)}`);

        const typedResponse: QueuedResponseMemory = {
            id: queuedResponse.id,
            tweet: convertDbTweetToQueuedTweet(tweet),
            response: queuedResponse.response,
            status: 'pending',
            created_at: new Date(),
            updatedAt: new Date(),
            workflowState: queuedResponse.workflowState
        };

        logger.info(`Adding to queue: ${JSON.stringify(typedResponse)}`);
        await addResponse(typedResponse);
        logger.info(`Moved skipped tweet ${skippedId} to response queue`);
        return typedResponse;
    } catch (error) {
        logger.error('Failed to move skipped tweet to queue:', error);
        throw error;
    }
};

//////////UTILS//////////
const isUniqueConstraintError = (error: any): boolean => {
    return error?.code === 'SQLITE_CONSTRAINT' &&
        error?.message?.includes('UNIQUE constraint failed');
};

export async function isTweetExists(tweetId: string): Promise<boolean> {
    const tweet = await db.getTweetById(tweetId);
    return tweet !== undefined;
}