import { Character } from '../../../config/characters.js';
import { createPrompts } from '../orchestrator/prompts.js';
import { OrchestratorPrompts } from '../orchestrator/types.js';

export const createGithubPrompts = async (character: Character): Promise<OrchestratorPrompts> => {
  const customInputInstructions = `
    - **IMPORTANT**: You have to take ACTIONS after data gathering. Fetching issues/PRs is data gathering NOT an action! Actions are creating/commenting on issues, reacting to comments, etc.
    - Before taking any action, always check existing context using appropriate search and list tools.
    - Use get_github_authenticated_user to identify yourself before checking comments or issues.
    
    Best Practices:
    - Before creating new issues/PRs:
      - Use search_github_issues to find related existing issues
      - Check list_github_issues for similar open items
      - Check recently closed issues for similar items
      - Review list_github_pull_requests for related PRs
    - Before commenting:
      - Check list_github_comments or list_github_pr_comments for existing discussion
      - Avoid duplicate comments
      - Use threading appropriately in discussions
      - Don't comment on your own issues/PRs except if you are responding to a comment made by someone else
    - For engagement:
      - Use create_github_reaction appropriately to acknowledge messages
      - React meaningfully to show agreement/understanding
      - Don't react to your own issues/PRs or comments
      - Keep track of mentions using list_github_mentions
    - For monitoring:
      - Use watch_github_repository for important repos
      - Check list_github_notifications regularly
      - Review list_watched_github_repositories periodically

    Important Guidelines:
    - Always verify context before taking actions
    - Keep comments concise, professional, and constructive

    - **DO NOT BE REPETITIVE**, use different phrasing in each interaction
    - Banned words: ${character.communicationRules.wordsToAvoid.join(', ')}
    - General communication rules: ${character.communicationRules.rules.join(', ')}
    `;

  const customMessageSummaryInstructions = `
    - Summarize the GitHub actions taken in detail (issues created/commented, PRs reviewed, reactions added, etc.)
    - Include reasoning for each action and relevant metadata (issue numbers, PR numbers, timestamps)
    - Document any important decisions or context that influenced actions`;

  const customFinishWorkflowInstructions = `
    - Summarize all GitHub interactions and their outcomes
    - Document key decisions and their reasoning
    - Report on:
      - What went well (successful interactions, resolved issues, merged PRs)
      - What could be improved (response times, clarity of communication)
      - Outstanding items requiring follow-up
    - Note any patterns or insights for future interactions`;

  return await createPrompts(character, {
    inputInstructions: customInputInstructions,
    messageSummaryInstructions: customMessageSummaryInstructions,
    finishWorkflowInstructions: customFinishWorkflowInstructions,
  });
};
