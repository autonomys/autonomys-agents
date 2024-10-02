import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import { WriterAgentParams } from './types';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { webSearchTool } from './tools';
import { generationSchema, reflectionSchema, researchDecisionSchema } from './schemas';
import { generationPrompt, reflectionPrompt, researchDecisionPrompt } from './prompts';

// Load environment variables
dotenv.config();

const MODEL = 'gpt-4o-mini';

// Configure the content generation LLM with structured output
const generationLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.7,
  maxTokens: 2000,
}).withStructuredOutput(generationSchema, { name: 'generation' });

// Create the content generation chain
const contentGenerationChain = generationPrompt.pipe(generationLlm);

// Configure the reflection model with structured output
const reflectLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.2,
  maxTokens: 1000,
}).withStructuredOutput(reflectionSchema, { name: 'reflection' });

// Create the reflection chain using the reflection prompt and the structured model
const reflect = reflectionPrompt.pipe(reflectLlm);

// Create a list of tools
const tools = [webSearchTool];
// Create the ToolNode with the tools
const toolNode = new ToolNode(tools);

// Configure the research decision model
const researchDecisionLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.2,
}).withStructuredOutput(researchDecisionSchema);

// Create the research decision chain
const researchDecisionChain = researchDecisionPrompt.pipe(researchDecisionLlm);

// Update the State interface
const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  reflectionScore: Annotation<number>(),
  researchPerformed: Annotation<boolean>(),
});

const researchNode = async (state: typeof State.State) => {
  const { messages } = state;
  console.log('Research Node - Input:', messages);

  const decisionResponse = await researchDecisionChain.invoke({ messages });
  console.log('Research Decision:', decisionResponse);

  if (decisionResponse.decision === 'yes') {
    const topicMessage = messages.find(msg => msg._getType() === 'human');
    const query = topicMessage?.content || '';

    const toolResponse = await toolNode.invoke({
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: 'web_search',
              args: { query },
              id: 'tool_call_id',
              type: 'tool_call',
            },
          ],
        }),
      ],
    });

    console.log('Research Node - Tool Response:', toolResponse);

    return {
      messages: [new HumanMessage({ content: `Research findings:\n${toolResponse.messages[0].content}` })],
      researchPerformed: true,
    };
  } else {
    console.log('Research Node - No research needed');
    return { researchPerformed: false };
  }
};

const generationNode = async (state: typeof State.State) => {
  const { messages } = state;
  console.log('Generation Node - Input:', messages);
  const response = await contentGenerationChain.invoke({ messages });
  console.log('Generation Node - Output:', response);
  return {
    messages: [new AIMessage({ content: JSON.stringify(response) })],
  };
};

const reflectionNode = async (state: typeof State.State) => {
  const { messages } = state;
  console.log('Reflection Node - Input:', messages);
  const clsMap: { [key: string]: new (content: string) => BaseMessage } = {
    ai: HumanMessage,
    human: AIMessage,
  };
  const translated = [messages[0], ...messages.slice(1).map(msg => new clsMap[msg._getType()](msg.content.toString()))];
  const res = await reflect.invoke({ messages: translated });
  console.log('Reflection Node - Output:', res);

  const { score, critique } = res;

  return {
    messages: [new HumanMessage({ content: critique })],
    reflectionScore: score,
  };
};

const shouldContinue = (state: typeof State.State) => {
  const { reflectionScore } = state;
  if (reflectionScore > 7 || state.messages.length > 10) {
    return END;
  }
  return 'reflect';
};

// Update the workflow
const workflow = new StateGraph(State)
  .addNode('research', researchNode)
  .addNode('generate', generationNode)
  .addNode('reflect', reflectionNode)
  .addEdge(START, 'research')
  .addConditionalEdges('research', state => (state.researchPerformed ? 'generate' : END))
  .addConditionalEdges('generate', shouldContinue)
  .addEdge('reflect', 'generate');

const app = workflow.compile({ checkpointer: new MemorySaver() });

export const writerAgent = async ({ category, topic, contentType, otherInstructions }: WriterAgentParams) => {
  console.log('WriterAgent - Starting with params:', { category, topic, contentType, otherInstructions });
  const instructions = `Create ${contentType} content. Category: ${category}. Topic: ${topic}. ${otherInstructions}`;

  const checkpointConfig = { configurable: { thread_id: 'my-thread' } };

  const initialState = {
    messages: [
      new HumanMessage({
        content: instructions,
      }),
    ],
    reflectionScore: 0,
    researchPerformed: false,
  };

  console.log('WriterAgent - Initial state:', initialState);

  const stream = await app.stream(initialState, checkpointConfig);

  let finalContent = '';
  let iterationCount = 0;
  for await (const event of stream) {
    console.log(`WriterAgent - Iteration ${iterationCount}:`, JSON.stringify(event, null, 2));
    iterationCount++;
    if (event.generate) {
      const aiMessages = event.generate.messages.filter((msg: BaseMessage) => msg._getType() === 'ai');
      console.log('WriterAgent - AI Messages:', JSON.stringify(aiMessages, null, 2));
      if (aiMessages.length > 0) {
        try {
          const parsedContent = JSON.parse(aiMessages[aiMessages.length - 1].content);
          console.log('WriterAgent - Parsed Content:', JSON.stringify(parsedContent, null, 2));
          if (parsedContent.generatedContent) {
            finalContent = parsedContent.generatedContent;
            console.log('WriterAgent - Updated Final Content:', finalContent);
          } else {
            console.warn('WriterAgent - generatedContent not found in parsed content');
          }
          if (parsedContent.other) {
            console.log('Additional information:', parsedContent.other);
          }
        } catch (error) {
          console.error('WriterAgent - Error parsing AI message content:', error);
        }
      }
    }
  }

  console.log('WriterAgent - Final content:', finalContent);

  if (!finalContent) {
    console.error('WriterAgent - No content was generated');
    throw new Error('Failed to generate content');
  }

  return finalContent;
};
