import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { VectorDB } from '../../../../services/vectorDb/VectorDB.js';
const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModel, prompts }: OrchestratorConfig, vectorStore: VectorDB) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    logger.info('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: messages.map(message => message.content),
    });
    logger.debug('Formatted prompt:', { formattedPrompt });
    const result = await orchestratorModel.invoke(formattedPrompt);
    
    const usage = result.additional_kwargs?.usage as
      | { input_tokens: number; output_tokens: number }
      | undefined;
    logger.info('Result:', {
      content: result.content,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
    });
    await vectorStore.insert(JSON.stringify(result.content));
    return {
      messages: [result],
    };
  };
  return runNode;
};
