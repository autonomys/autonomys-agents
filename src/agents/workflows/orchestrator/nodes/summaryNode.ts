import { BaseMessage, AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig } from '../types.js';

const logger = createLogger('summary-node');

export const createSummaryNode = (config: OrchestratorConfig) => {
  const SUMMARY_WINDOW = 10;
  const MAX_HISTORY = 20; 

  return async (state: {
    messages: readonly BaseMessage[];
  }) => {
    const recentMessages = state.messages.slice(-SUMMARY_WINDOW);
    
    if (recentMessages.length === 0) {
      return { messages: [] };
    }

    const newMessages = recentMessages
      .map(msg => `${msg.getType()}: ${msg.content}`)
      .join('\n');

    const newSummary = await config.prompts.summaryPrompt
      .pipe(config.orchestratorModel)
      .invoke({
        prevSummary: state.messages[0]?.content || "No previous summary",
        newMessages
      });

    // Keep the summary and most recent messages only
    return {
      messages: [
        new AIMessage({ content: newSummary.content }),
        ...state.messages.slice(-(MAX_HISTORY - 1))
      ]
    };
  };
}; 