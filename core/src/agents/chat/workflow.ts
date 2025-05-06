import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { ChatState } from './state.js';
import { createNodes } from './nodes.js';
import { ChatNodeConfig } from './types.js';
import { createChatNodeConfig } from './config.js';

export const createChatWorkflow = async (options: ChatNodeConfig) => {
  const { modelConfig, tools } = createChatNodeConfig(options);
  const { inputNode, executor } = createNodes({
    modelConfig,
    tools,
  });

  /**
   * Handles the conditional edge routing in the workflow graph based on current state
   */
  const handleConditionalEdge = async (state: typeof ChatState.State) => {
    if (state.toolCalls && state.toolCalls.length > 0) {
      return 'executor';
    }
    return END;
  };

  const workflow = new StateGraph(ChatState)
    .addNode('input', inputNode)
    .addNode('executor', executor)
    .addEdge(START, 'input')
    .addConditionalEdges('input', handleConditionalEdge)
    .addEdge('executor', 'input');

  const memorySaver = new MemorySaver();

  const chatApp = workflow.compile({ checkpointer: memorySaver });
  return chatApp;
};
