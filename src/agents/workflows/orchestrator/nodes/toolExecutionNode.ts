import { DynamicStructuredTool } from '@langchain/core/tools';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType } from '../types.js';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('tool-execution-node');

export const createToolExecutionNode = ({ tools }: { tools: DynamicStructuredTool[] }) => {
  const toolByNames = tools.map(tool => ({ name: tool.name, tool }));

  const runNode = async (state: OrchestratorStateType) => {
    try {
      logger.info('Tool execution node - Starting tool execution');

      const { toolCalls } = state;
      const executedTools = [];
      const results = [];
      if (toolCalls) {
        for (const toolCall of toolCalls) {
          try {
            const selectedTool = toolByNames.find(
              toolItem => toolItem.name === toolCall.name,
            )?.tool;
            const result = await selectedTool?.invoke(toolCall.args);
            results.push(
              new AIMessage({
                name: toolCall.name,
                content: result,
              }),
            );
            executedTools.push(toolCall.name);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger.error(`Error executing tool ${toolCall.name}:`, error);
            results.push(
              new AIMessage({
                content: `Error executing tool ${toolCall.name}: ${errorMessage}`,
              }),
            );
          }
        }
      }

      logger.info('Tool execution results:', results);
      return { messages: results, executedTools };
    } catch (error) {
      logger.error('Error in tool execution:', error);
      return { messages: [] };
    }
  };
  return runNode;
};
