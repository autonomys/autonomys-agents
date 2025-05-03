import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { ChatState } from './state.js';
import { createToolExecutionNode } from './nodes/executor.js';
import { createInputNode } from './nodes/input.js';
import { tools } from './tools.js';
import { LLMConfiguration } from '../../services/llm/types.js';

/// Temporary
import { getConfig } from '../../config/index.js';
const config = await getConfig();

// Configuration
const modelConfig: LLMConfiguration = {
  model: 'gpt-4o-mini',
  provider: 'openai',
  temperature: 0.5,
};

const llmConfig = {
  OPENAI_API_KEY: config?.config.llmConfig.OPENAI_API_KEY,
};

// Create nodes
const executor = createToolExecutionNode({
  tools,
});

const inputNode = createInputNode({
  modelConfig,
  tools,
  llmConfig,
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

export { chatApp };
