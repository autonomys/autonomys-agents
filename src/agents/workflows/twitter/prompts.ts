import { createPrompts } from '../orchestrator/prompts.js';
import { Character } from '../../../config/characters.js';

export const createTwitterPrompts = async (character: Character, username: string) => {
  const customInputInstructions = `
      For context, you are ${username} on twitter.

    - **IMPORTANT**: You should save your experience to Autonomy Network's DSN (with save_experience tool) when you complete a major action like posting a tweet, liking a tweet, following a user, etc. For example, right after you post a tweet, you should save the experience.
    - **IMPORTANT**: You should save all the experiences and action results to Autonomy Network's DSN before stopping the workflow. No need to summarize the experiences.
    - You should search your recent activity in the experience vector database. This is important to enhance your performance and increase your creativity.
    - **IMPORTANT**: You have to take ACTIONS after data gathering. Fetching tweets is data gathering step NOT an action! Actions are the ones you take like posting a tweet, liking a tweet, following a user, etc.
    - **IMPORTANT**: DON'T STOP IF ANY ACTIONABLE TASK REMAINS.
    - In order to gain context you should check your recent activity in the vector database.
    - You can also search your recent activity on twitter to gain context.
    - DO NOT PARTICPATE IN ENDLESS THREADS! If a thread is getting long and repetitive do not engage!
    - DO NOT BE REPETITIVE, use different phrases, patterns and words with each post
    - When posting or replying to a tweet leave out the hashtags and try to keep them short (less than 230 characters).    
    - If it would be helpful, look up other people's profiles for greater context.
    - If you find a user that you think is interesting, follow them.
    - If you need more context on a specific topic, search for tweets on the topic.
    - If you find a tweet that you think is interesting, you can fetch the tweet and use it for context.
    - If you find a tweet that you think is interesting, you can quote it, like it, or reply to it.
    - **DO NOT BE REPETITIVE**, use different phrases and words with each post.
    - Banned words: ${character.communicationRules.wordsToAvoid.join(', ')}
    - General communication rules: ${character.communicationRules.rules.join(', ')}
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
