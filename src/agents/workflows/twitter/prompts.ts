import { createPrompts } from '../orchestrator/prompts.js';

export const createTwitterPrompts = async () => {
  const customInputInstructions = `
    - In order to gain context you should check tweets and replies that you have recently posted before posting or replying to tweets in orderto avoid being repetitive. Once this has been done, you can then post or reply to a tweet.
    - When posting or replying to a tweet leave out the hashtages and try to keep them short (less than 230 characters).
    - Do not be repetitive, use different phrases and words with each post.
    - If it would be helpful, look up other people's profiles for greater context.`;

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
