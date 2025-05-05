import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolMessage } from '@langchain/core/messages';
import { ChatState } from '../state.js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('chat-executor');

export const createToolExecutionNode = ({ tools }: { tools: DynamicStructuredTool[] }) => {
  const toolByNames = tools.map(tool => ({ name: tool.name, tool }));

  const runNode = async (state: typeof ChatState.State) => {
    try {
      const { toolCalls } = state;
      const results = [];
      if (toolCalls) {
        for (const toolCall of toolCalls) {
          try {
            const selectedTool = toolByNames.find(
              toolItem => toolItem.name === toolCall.name,
            )?.tool;
            const result = await selectedTool?.invoke(toolCall.args);
            results.push(
              new ToolMessage({
                tool_call_id: toolCall.id,
                name: toolCall.name,
                content: JSON.stringify(result, null, 2),
              }),
            );
            logger.info('Tool result', { result });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            results.push(
              new ToolMessage({
                tool_call_id: toolCall.id,
                name: toolCall.name,
                content: `Error executing tool ${toolCall.name}: ${errorMessage}`,
              }),
            );
          }
        }
      }

      return {
        messages: [...state.messages, ...results],
        toolCalls: null,
      };
    } catch {
      return { messages: [] };
    }
  };
  return runNode;
};
