import {
  QueuedResponseMemory,
  ApprovalAction,
  SkippedTweetMemory,
  ActionResponse,
} from '../../types/queue.js';
import { createLogger } from '../../utils/logger.js';
import * as db from '../../database/index.js';
import { Tweet } from '../../types/twitter.js';
import { getPendingResponsesByTweetId } from '../../database/index.js';
import { getTweetById } from '../../database/index.js';

const logger = createLogger('database-queue');

///////////RESPONSE///////////
export async function addResponse(response: QueuedResponseMemory): Promise<void> {
  try {
    try {
      await db.addTweet({
        id: response.tweet.id,
        author_id: response.tweet.author_id,
        author_username: response.tweet.author_username,
        content: response.tweet.text,
        created_at: response.tweet.created_at,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        logger.warn(`Tweet already exists: ${response.tweet.id}`);
      } else {
        throw error;
      }
    }
    await db.addResponse({
      id: response.id,
      tweet_id: response.tweet.id,
      content: response.response.content,
      tone: response.workflowState.toneAnalysis?.suggestedTone || 'neutral',
      strategy: response.workflowState.responseStrategy?.strategy || 'direct',
      estimatedImpact: response.workflowState.responseStrategy?.estimatedImpact || 5,
      confidence: response.workflowState.responseStrategy?.confidence || 0.5,
    });
  } catch (error) {
    logger.error('Failed to add response to queue:', error);
    throw error;
  }
}

export const updateResponseStatus = async (
  action: ApprovalAction,
): Promise<ActionResponse | undefined> => {
  try {
    const pendingResponse = await getPendingResponsesByTweetId(action.id);
    const tweet = await getTweetById(pendingResponse.tweet_id);
    await db.updateResponseStatus(action.id, action.approved ? 'approved' : 'rejected');
    logger.info(`Updated response status: ${action.id}`);

    return {
      tweet: tweet as Tweet,
      status: action.approved ? 'approved' : 'rejected',
      response: pendingResponse as unknown as ActionResponse['response'],
    };
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
      tweet: {
        id: r.tweet_id,
        author_username: r.author_username,
        text: r.tweet_content,
        author_id: r.author_id,
        created_at: r.created_at,
      },
      response: {
        content: r.content,
      },
      status: r.status as 'pending' | 'approved' | 'rejected',
      created_at: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      workflowState: {
        toneAnalysis: {
          suggestedTone: r.tone,
        },
        engagementDecision: {
          reason: r.strategy,
          priority: r.estimated_impact,
        },
      } as any,
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
      await db.addTweet({
        id: skipped.tweet.id,
        author_id: skipped.tweet.author_id,
        author_username: skipped.tweet.author_username,
        content: skipped.tweet.text,
        created_at: skipped.tweet.created_at,
      });
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
      confidence: skipped.workflowState.decision?.confidence || 0,
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
    tweet: {
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      author_username: tweet.author_username,
      created_at: tweet.created_at,
    },
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
        priority: skipped.priority,
      },
    },
  };

  return result;
}

export const moveSkippedToQueue = async (
  skippedId: string,
  queuedResponse: Omit<QueuedResponseMemory, 'status'> & { status: 'pending' },
): Promise<QueuedResponseMemory> => {
  try {
    const skipped = (await getSkippedTweetById(skippedId)) as any;
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
      tweet: {
        id: tweet.id,
        text: tweet.text,
        author_id: tweet.author_id,
        author_username: tweet.author_username,
        created_at: tweet.created_at,
      },
      response: queuedResponse.response,
      status: 'pending',
      created_at: new Date(),
      updatedAt: new Date(),
      workflowState: queuedResponse.workflowState,
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
  return (
    error?.code === 'SQLITE_CONSTRAINT' && error?.message?.includes('UNIQUE constraint failed')
  );
};

export async function isTweetExists(tweetId: string): Promise<boolean> {
  const tweet = await db.getTweetById(tweetId);
  return tweet !== undefined;
}
