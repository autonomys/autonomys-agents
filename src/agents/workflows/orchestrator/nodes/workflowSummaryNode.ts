import { AIMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
const logger = createLogger('workflow-summary-node');

export const createWorkflowSummaryNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    logger.info('Workflow Summary Node');

    const messages = state.messages
      .map(msg => {
        const content =
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
        return `${msg.getType()}: ${content}`;
      })
      .join('\n');

    const formattedPrompt = await prompts.workflowSummaryPrompt.format({
      messages,
      currentTime: new Date().toISOString(),
    });
    logger.info('Summarizing messages:', { messages });

    const result = await orchestratorModel.invoke(formattedPrompt);

    const summary =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

    logger.info('Workflow summary:', { summary });

    return {
      messages: [new AIMessage({ content: `Workflow summary: ${summary}` })],
    };
  };
  return runNode;
};
