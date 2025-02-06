import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { finishedWorkflowParser } from './finishWorkflowPrompt.js';
import { AIMessage } from '@langchain/core/messages';
import { VectorDB } from '../../../../services/vectorDb/VectorDB.js';
const logger = createLogger('finish-workflow-node');

const parseFinishWorkflow = async (content: unknown) => {
  const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  if (typeof contentString === 'string') {
    try {
      return await finishedWorkflowParser.parse(contentString);
    } catch (error) {
      logger.error('Failed to parse workflow control. Applying fallback termination.', {
        error,
        content,
      });
      return { workflowSummary: 'Failed to parse workflow content' };
    }
  }
  return { workflowSummary: 'Failed to parse workflow content' };
};

export const createFinishWorkflowNode = (
  { orchestratorModel, prompts }: OrchestratorConfig,
  vectorStore: VectorDB,
) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    logger.info('Finish Workflow Node');

    const messages = state.messages
      .map(msg => {
        const content =
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
        return `${msg.getType()}: ${content}`;
      })
      .join('\n');

    const formattedPrompt = await prompts.finishWorkflowPrompt.format({
      messages,
      currentTime: new Date().toISOString(),
    });
    logger.info('Summarizing messages:', { messages });

    const result = await orchestratorModel.invoke(formattedPrompt);
    const finishedWorkflow = await parseFinishWorkflow(result.content);

    logger.info('Finished Workflow:', { finishedWorkflow });

    await vectorStore.insert(JSON.stringify(finishedWorkflow));

    return {
      messages: [new AIMessage({ content: result.content })],
      ...finishedWorkflow,
    };
  };
  return runNode;
};
