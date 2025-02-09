import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorStateType } from '../types.js';
import { decisionControlParser } from './decisionPrompt.js';

const logger = createLogger('orchestrator-decision-node');

const parseDecisionControl = async (content: unknown) => {
  if (typeof content === 'string') {
    try {
      return await decisionControlParser.parse(content);
    } catch (error) {
      logger.error('Failed to parse decision control. Applying fallback termination.', {
        error,
        content,
      });
      return {
        shouldStop: true,
        reason: 'Failed to parse decision control. Applying fallback termination.',
      };
    }
  }
  return {
    shouldStop: true,
    reason: 'Failed to parse decision control. Applying fallback termination.',
  };
};

export const createDecisionNode = ({
  orchestratorModel,
  prompts,
  vectorStore,
}: OrchestratorConfig) => {
  const runNode = async (state: OrchestratorStateType) => {
    const { messages } = state;
    logger.info('Running decision node with messages:', {
      messages: messages.map(message => message.content),
    });

    const formattedPrompt = await prompts.decisionPrompt.format({
      messages: messages.map(message => message.content),
    });

    logger.info('Formatted prompt:', { formattedPrompt });
    const result = await orchestratorModel.invoke(formattedPrompt);

    const usage = result.additional_kwargs?.usage as
      | { prompt_tokens: number; completion_tokens: number; total_tokens: number }
      | undefined;
    logger.info('Result:', {
      content: result.content,
      inputTokens: usage?.prompt_tokens,
      outputTokens: usage?.completion_tokens,
    });
    await vectorStore.insert(JSON.stringify(result.content));

    return {
      messages: [result],
      decisionControl: await parseDecisionControl(result.content),
    };
  };
  return runNode;
};
