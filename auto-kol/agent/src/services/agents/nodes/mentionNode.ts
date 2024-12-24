import { AIMessage } from "@langchain/core/messages";
import { parseMessageContent, WorkflowConfig } from "../workflow.js";
import { logger } from "../workflow.js";
import { State } from "../workflow.js";
import { tweetSearchSchema } from "../../../schemas/workflow.js";
import { ExtendedScraper } from "../../twitter/api.js";
import { Tweet } from "../../../types/twitter.js";

export const createMentionNode = (config: WorkflowConfig, scraper: ExtendedScraper) => {
    return async (state: typeof State.State) => {
        logger.info('Mention Node - Fetching recent mentions');
        const toolResponse = await config.toolNode.invoke({
            messages: [
                new AIMessage({
                    content: '',
                    tool_calls: [{
                        name: 'fetch_mentions',
                        args: {},
                        id: 'fetch_mentions_call',
                        type: 'tool_call'
                    }]
                })
            ]
        });

        const parsedContent = parseMessageContent(toolResponse.messages[toolResponse.messages.length - 1].content);
        const parsedTweets = tweetSearchSchema.parse(parsedContent);
        logger.info(`Found ${parsedTweets.tweets.length} tweets`);
        for (const tweet of parsedTweets.tweets) {
            logger.info(`Getting thread for tweet ${tweet.id}`);
            const tweetsWithThreads: Tweet[] = [];
            const thread = await scraper.getThread(tweet.id);
            for await (const threadTweet of thread) {
                tweetsWithThreads.push({
                    id: threadTweet.id || '',
                    text: threadTweet.text || '',
                    author_id: threadTweet.userId || '',
                    author_username: threadTweet.username?.toLowerCase() || 'unknown',
                    created_at: threadTweet.timeParsed?.toISOString() || new Date().toISOString()
                });
            }
            tweet.thread = tweetsWithThreads;
            await new Promise(resolve => setTimeout(resolve, 5000));
            logger.info(`Found ${tweetsWithThreads.length} tweets in thread`);
            break;
        }
        return {
            messages: [new AIMessage({
                content: JSON.stringify(parsedTweets)
            })],
            lastProcessedId: parsedTweets.lastProcessedId || undefined
        };
    }
}