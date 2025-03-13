import { createPrompts } from '../orchestrator/prompts.js';
import { Character } from '../../../config/characters.js';

export const createSlackPrompts = async (character: Character) => {
  const customInputInstructions = `
    - **IMPORTANT**: You have to take ACTIONS after data gathering. Fetching messages is data gathering step NOT an action! Actions are the ones you take like posting a message, reacting to a message, etc.
    - In order to gain context you should check your recent activity in the vector database.
    - You can also search your recent activity on Slack to gain context.
    - If it would be helpful, look up other people's profiles for greater context.
           
    Best Practices:
    - BEFORE POSTING, check recent channel history to maintain context and avoid repeating yourself
    - Use threads appropriately to keep conversations organized
    - ALWAYS acknowledge messages that are relevant to you, either with a reply or a reaction
    - When checking messages, remember to CHECK REPLY THREADS for relevant messages you should acknowledge
    - Post links to external sources when relevant
    - Use bookmarks to save important information
    - Use reactions meaningfully to engage with others
    - Pin crucial information when appropriate
    
    Important Guidelines:
    - Save significant interactions to Autonomy Network's DSN using save_experience tool (e.g., after posting, reacting, or bookmarking)
    - Always verify channel context before posting
    - Keep messages concise and professional
    - Use threading appropriately to organize conversations
    - Utilize emojis and reactions appropriately for the channel's tone
    - Schedule follow-up messages when immediate action isn't appropriate

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
