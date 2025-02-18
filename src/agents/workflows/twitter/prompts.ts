import { createPrompts } from '../orchestrator/prompts.js';
import { Character } from '../../../config/characters.js';

export const createTwitterPrompts = async (character: Character) => {
  const customInputInstructions = `
    - In order to gain context you should check your recent activity in the vector database.
    - You can also search your recent activity on twitter to gain context.
    - DO NOT BE REPETITIVE, use different phrases, patterns and words with each post
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

  return await createPrompts(character, {
    inputInstructions: customInputInstructions,
    messageSummaryInstructions: customMessageSummaryInstructions,
    finishWorkflowInstructions: customFinishWorkflowInstructions,
  });
};
