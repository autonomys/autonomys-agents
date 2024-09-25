import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an essay assistant tasked with writing excellent 5-paragraph essays.
Generate the best essay possible for the user's request.  
If the user provides critique, respond with a revised version of your previous attempts.`,
  ],
  new MessagesPlaceholder('messages'),
]);

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  temperature: 1,
  maxTokens: 16384,
});
const essayGenerationChain = prompt.pipe(llm);

const generateEssay = async (request: any) => {
  let essay = '';
  for await (const chunk of await essayGenerationChain.stream({
    messages: [request],
  })) {
    console.log(chunk.content);
    essay += chunk.content;
  }
  return essay;
};

// Usage example:
// const essay = await generateEssay(someRequest);

const reflectionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a teacher grading an essay submission.
  Generate critique and recommendations for the user's submission.
  Provide detailed recommendations, including requests for length, depth, style, etc.`,
  ],
  new MessagesPlaceholder('messages'),
]);
const reflect = reflectionPrompt.pipe(llm);

const generateReflection = async (request: any) => {
  let reflection = '';
  for await (const chunk of await reflect.stream({
    messages: [request],
  })) {
    console.log(chunk.content);
    reflection += chunk.content;
  }
};

// Define the top-level State interface
const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const generationNode = async (state: typeof State.State) => {
  const { messages } = state;
  return {
    messages: [await essayGenerationChain.invoke({ messages })],
  };
};

const reflectionNode = async (state: typeof State.State) => {
  const { messages } = state;
  // Other messages we need to adjust
  const clsMap: { [key: string]: new (content: string) => BaseMessage } = {
    ai: HumanMessage,
    human: AIMessage,
  };
  // First message is the original user request. We hold it the same for all nodes
  const translated = [messages[0], ...messages.slice(1).map(msg => new clsMap[msg._getType()](msg.content.toString()))];
  const res = await reflect.invoke({ messages: translated });
  // We treat the output of this as human feedback for the generator
  return {
    messages: [new HumanMessage({ content: res.content })],
  };
};

// Define the graph
const workflow = new StateGraph(State)
  .addNode('generate', generationNode)
  .addNode('reflect', reflectionNode)
  .addEdge(START, 'generate');

const shouldContinue = (state: typeof State.State) => {
  const { messages } = state;
  if (messages.length > 4) {
    // End state after 3 iterations
    return END;
  }
  return 'reflect';
};

workflow.addConditionalEdges('generate', shouldContinue).addEdge('reflect', 'generate');

const app = workflow.compile({ checkpointer: new MemorySaver() });

export const writerAgent = async (instructions: string) => {
  const checkpointConfig = { configurable: { thread_id: 'my-thread' } };

  const stream = await app.stream(
    {
      messages: [
        new HumanMessage({
          content: instructions,
        }),
      ],
    },
    checkpointConfig
  );

  for await (const event of stream) {
    for (const [key, _value] of Object.entries(event)) {
      console.log(`Event: ${key}`);
      // Uncomment to see the result of each step.
      // console.log(value.map((msg) => msg.content).join("\n"));
      console.log('\n------\n');
    }
  }
  const snapshot = await app.getState(checkpointConfig);
  const essay = snapshot.values.messages.map((msg: BaseMessage) => msg.content).join('\n\n\n------------------\n\n\n');
  return essay;
};
