import { createPrompts } from '../orchestrator/prompts.js';
import { config } from '../../../config/index.js';

export const createTwitterPrompts = async () => {
  const character = config.characterConfig;
  const customInputInstructions = `
    - In order to gain context you should check tweets and replies that you have recently posted before posting or replying to tweets in order to **AVOID BEING REPETITIVE**. Once this has been done, you can then post or reply to a tweet. DO NOT USE THE SAME PHRASE OR WORDS TWICE.
    - When given directions to post a tweet with specific content, it is a suggestion, not a requirement. You can post a tweet with different content if you think it is more appropriate or TO AVOID BEING REPETITIVE.
    - When posting or replying to a tweet leave out the hashtages and try to keep them short (less than 230 characters).    
    - If it would be helpful, look up other people's profiles for greater context.
    - If you find a user that you think is interesting, follow them.
    - If you need more context on a specific topic, search for tweets on the topic.
    - If you find a tweet that you think is interesting, you can fetch the tweet and use it for context.
    - **DO NOT BE REPETITIVE**, use different phrases and words with each post.
    - Banned words: ${character.communicationRules.wordsToAvoid.join(', ')}
    `;

  const customMessageSummaryInstructions = `
    - Summarize the actions taken in detail. Include reasoning and metadata like tweet IDs/timestamps.
    - Try to capture high level reasoning for actions`;

  const customFinishWorkflowInstructions = `
    - Summarize the actions taken in detail. Include reasoning and metadata like tweet IDs/timestamps.
    - Try to capture high level reasoning for actions taken.
    - Report should include what you think went well and what you think could be improved.
    - Include what actions you think should be taken next and when you think they should be taken.`;

  return await createPrompts({
    inputInstructions: customInputInstructions,
    messageSummaryInstructions: customMessageSummaryInstructions,
    finishWorkflowInstructions: customFinishWorkflowInstructions,
  });
};
