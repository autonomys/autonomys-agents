import type { MemoryV2_0_0, ResponseV2_0_0, SkippedEngagementV2_0_0, GeneratedTweetV2_0_0, Tweet } from '../types/generated/v2_0_0.js';
import { ResponseStatus } from '../types/enums.js';
import { config } from '../config/index.js';

function transformTweet(tweet: Tweet): any {
    return {
        id: tweet.id,
        text: tweet.text,
        author_username: tweet.username,
        created_at: tweet.timeParsed,
        thread: Array.isArray(tweet.thread) ? tweet.thread.map(transformTweet) : undefined,
        quotedStatus: tweet.quotedStatus ? (tweet.quotedStatus) : undefined
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
            previousCid: memory.previousCid,
            agentVersion: memory.agentVersion
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
            tweet: {
                id: postedMemory.tweetId,
                text: postedMemory.content,
                author_id: '1861873566687404032',
                author_username: config.AGENT_USERNAME,
                created_at: postedMemory.timestamp,
            },
            signature: postedMemory.signature,
            timestamp: postedMemory.timestamp,
            previousCid: postedMemory.previousCid,
            agentVersion: postedMemory.agentVersion
        };
    }

    // Fallback case
    return memory;
} 
