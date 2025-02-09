import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorStateType } from '../types.js';
const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({
  orchestratorModel,
  prompts,
  toolNode,
  vectorStore,
}: OrchestratorConfig) => {
  const runNode = async (state: OrchestratorStateType) => {
    const { messages } = state;
    logger.info('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: messages.map(message => message.content),
    });

    const result = await orchestratorModel.bind({ tools: toolNode.tools }).invoke(formattedPrompt);

    const usage = result.additional_kwargs?.usage as
      | { input_tokens: number; output_tokens: number }
      | undefined;
    logger.info('Result:', {
      content: result.content,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
    });
    await vectorStore.insert(JSON.stringify(result.content));

    return { messages: [result] };
  };
  return runNode;
};
