import type { MemoryV2_0_0, ResponseV2_0_0, SkippedEngagementV2_0_0, GeneratedTweetV2_0_0, Tweet } from '../types/generated/v2_0_0.js';
import { ResponseStatus } from '../types/enums.js';

function transformTweet(tweet: Tweet): any {
    return {
        id: tweet.id,
        text: tweet.text,
        author_username: tweet.username,
        created_at: tweet.timeParsed,
        thread: tweet.thread?.map(transformTweet)
    };
}

export function transformMemoryToLegacy(memory: MemoryV2_0_0) {
    if (!('type' in memory)) {
        return transformTweet(memory as Tweet);
    }

    if ('tweet' in memory) {
        const baseTransform = {
            type: memory.type,
            tweet: transformTweet(memory.tweet),
            signature: memory.signature,
            timestamp: memory.timestamp,
            previousCid: memory.previousCid
        };

        if (memory.type === 'response') {
            const responseMemory = memory as ResponseV2_0_0;
            return {
                ...baseTransform,
                type: 'approved',
                response: responseMemory.content,
                workflowState: {
                    decision: {
                        shouldEngage: true,
                        reason: responseMemory.decision.reason
                    },
                    toneAnalysis: {},
                    responseStrategy: {
                        strategy: responseMemory.strategy,
                        referencedTweets: []
                    }
                }
            };
        } else if (memory.type === 'skipped') {
            const skippedMemory = memory as SkippedEngagementV2_0_0;
            return {
                ...baseTransform,
                workflowState: {
                    decision: skippedMemory.decision
                }
            };
        }
    }

    if ('type' in memory && memory.type === 'posted') {
        const postedMemory = memory as GeneratedTweetV2_0_0;
        return {
            type: 'posted',
            response: postedMemory.content,
            tweetId: postedMemory.tweetId,
            signature: postedMemory.signature,
            timestamp: postedMemory.timestamp,
            previousCid: postedMemory.previousCid
        };
    }

    // Fallback case
    return memory;
} 
