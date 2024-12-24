import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent } from "../workflow.js";
import * as prompts from "../prompts.js";
import { getAllTrends } from "../../../database/index.js";
import { WorkflowConfig } from "../workflow.js";
import { config as globalConfig } from "../../../config/index.js";
import {
  addTopLevelTweet,
  getLatestTopLevelTweets,
  wipeTrendsTable,
} from "../../../database/index.js";
import { v4 as generateId } from "uuid";

export const createTopLevelTweetNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info("Trend Post Node - Creating tweet from trends");
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const parsedContent = parseMessageContent(lastMessage.content);
      const { tweets, currentTweetIndex } = parsedContent;

      const trends = await getAllTrends();

      if (!trends || trends.length === 0) {
        logger.info("No trends found to create tweet from");
        return {
          messages: [
            new AIMessage({
              content: JSON.stringify({
                fromTopLevelTweetNode: true,
                currentTweetIndex: currentTweetIndex,
                tweets: tweets,
                pendingEngagements: [],
                messages: [],
              }),
            }),
          ],
        };
      }

      const recentTrends = trends
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, 5);

      const trendSummaries = recentTrends.map((t) => t.content).join("\n\n");
      const latestTopLevelTweets = await getLatestTopLevelTweets();
      const recentResponseTexts =
        latestTopLevelTweets.map((r) => r.content).join("\n") ||
        "No previous responses yet";
      const lastTweetTime =
        latestTopLevelTweets[latestTopLevelTweets.length - 1].created_at;
      const timeSinceLastTweetInHours =
        (new Date().getTime() - lastTweetTime.getTime()) / (1000 * 60 * 60);

      const tweetGeneration = await prompts.topLevelTweetPrompt
        .pipe(config.llms.decision)
        .pipe(prompts.topLevelTweetParser)
        .invoke({
          trends: trendSummaries,
          recentResponseTexts,
        });

      logger.info("Generated trend tweet:", {
        tweet: tweetGeneration.tweet,
        reasoning: tweetGeneration.reasoning,
      });

      await addTopLevelTweet({
        id: generateId(),
        content: tweetGeneration?.tweet,
      });

      if (
        globalConfig.POST_TWEETS &&
        timeSinceLastTweetInHours > globalConfig.TOP_LEVEL_TWEET_INTERVAL_HOURS
      ) {
        await config.client.sendTweet(tweetGeneration.tweet);
        logger.info("Posted trend tweet successfully");
        await wipeTrendsTable();
      }

      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              fromTopLevelTweetNode: true,
              currentTweetIndex: currentTweetIndex,
              tweets: tweets,
              pendingEngagements: [],
              messages: [],
            }),
          }),
        ],
      };
    } catch (error) {
      logger.error("Error in trend post node:", error);
      return { messages: [] };
    }
  };
};
