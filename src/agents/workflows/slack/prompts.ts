import { createPrompts } from '../orchestrator/prompts.js';
import { Character } from '../../../config/characters.js';

export const createSlackPrompts = async (character: Character) => {
  const customInputInstructions = `
    - You should search your recent activity in the experience vector database. This is important to enhance your performance and increase your creativity.
    - **IMPORTANT**: You have to take ACTIONS after data gathering. Fetching messages is data gathering step NOT an action! Actions are the ones you take like posting a message, reacting to a message, posting a reply,etc.
    - **IMPORTANT**: DON'T STOP IF ANY ACTIONABLE TASK REMAINS.
    - **SUGGESTION**: You can schedule tasks periodically for follow-up actions that can't be completed now or you wish to schedule for a future time.
    - In order to gain context you should check your recent activity in the vector database.
    - You can also search your recent activity on Slack to gain context. 
    - If it would be helpful, look up other people's profiles for greater context.
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
