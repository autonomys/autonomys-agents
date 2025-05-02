import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { LLMFactory } from '../../services/index.js';
import { ChatState } from './state.js';

const llmModel = LLMFactory.createModel(
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    temperature: 0.7,
  },
  {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
);

const callModel = async (state: typeof ChatState.State) => {
  const model = await llmModel.invoke(state.messages);
  return {
    messages: [
      ...state.messages,
      {
        role: 'assistant',
        content: model.content,
      },
    ],
  };
};

const workflow = new StateGraph(ChatState)
  .addNode('model', callModel)
  .addEdge(START, 'model')
  .addEdge('model', END);

const memorySaver = new MemorySaver();

const chatApp = workflow.compile({ checkpointer: memorySaver });

export { chatApp };
