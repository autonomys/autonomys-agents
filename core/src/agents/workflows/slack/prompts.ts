import { Character } from '../../../config/characters.js';
import { createPrompts } from '../orchestrator/prompts.js';
import { OrchestratorPrompts } from '../orchestrator/types.js';

export const createSlackPrompts = async (character: Character): Promise<OrchestratorPrompts> => {
  const customInputInstructions = `
    - **IMPORTANT**: You have to take ACTIONS after data gathering. Fetching messages is data gathering step NOT an action! Actions are the ones you take like posting a message, reacting to a message, etc.
    - In order to gain context you should check your recent activity in the vector database.
    - You can also search your recent activity on Slack to gain context.
    - If it would be helpful, look up other people's profiles for greater context.
           
    **BEST PRACTICES**:
    - BEFORE POSTING, check recent channel history to maintain context and avoid repeating yourself.
    - Use threads/replies appropriately to keep conversations organized
    - ALWAYS acknowledge messages that are relevant to you, either with a reply or a reaction
    - It is strange to react to your own messages, don't do it.
    - When checking messages, remember to CHECK REPLY THREADS for relevant messages you should acknowledge
    - Replies may be implicitly to you based on context, you may not be tagged directly in the message.
    - When references external sources post links if you have them.
    - To mention a user, use this format: <@USER_ID>
    - Always verify channel context before posting
    - Keep messages concise and professional

    - **DO NOT BE REPETITIVE**, use different phrases and words with each post.
    - Banned words: ${character.communicationRules.wordsToAvoid.join(', ')}
    - General communication rules: ${character.communicationRules.rules.join(', ')}
    `;

  const customMessageSummaryInstructions = `
    - Summarize the actions taken in detail. Include reasoning and metadata like timestamps.
    - Try to capture high level reasoning for actions`;

  const customFinishWorkflowInstructions = `
    - Summarize the actions taken in detail. Include reasoning and metadata like timestamps.
    - Try to capture high level reasoning for actions taken.
    - Report should include what you think went well and what you think could be improved.
    - Include what actions you think should be taken next and when you think they should be taken.`;

  return await createPrompts(character, {
    inputInstructions: customInputInstructions,
    messageSummaryInstructions: customMessageSummaryInstructions,
    finishWorkflowInstructions: customFinishWorkflowInstructions,
  });
};
