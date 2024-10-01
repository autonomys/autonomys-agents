import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import dotenv from 'dotenv';
import { WriterAgentParams } from './types';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const MODEL = 'gpt-4o-mini';

// Define the content generation schema using Zod
const generationSchema = z.object({
  content: z.string().describe('The main content generated based on the given instructions.'),
  other: z.string().optional().describe('Any additional commentary or metadata about the generated content.'),
});

// Define the content generation prompt
const generationPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a versatile content creator capable of producing various types of content.
Generate high-quality content based on the user's request, considering the specified category, topic, and content type.
Adapt your writing style, length, and structure to suit the requested content type (e.g., essay, article, tweet thread, blog post).
If provided with critique or feedback, incorporate it to improve your next iteration.
Provide the main content in the 'content' field and any additional commentary or metadata in the 'other' field.`,
  ],
  new MessagesPlaceholder('messages'),
]);

// Configure the content generation LLM with structured output
const generationLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.7,
  maxTokens: 2000,
}).withStructuredOutput(generationSchema, { name: 'generation' });

// Create the content generation chain
const contentGenerationChain = generationPrompt.pipe(generationLlm);

// Define the reflection schema using Zod
const reflectionSchema = z.object({
  critique: z.string().describe('Detailed critique and recommendations for the content.'),
  score: z.number().min(1).max(10).describe('Reflection score between 1 and 10.'),
});

// Configure the reflection model with structured output
const reflectLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.2,
  maxTokens: 1000,
}).withStructuredOutput(reflectionSchema, { name: 'reflection' });

// Create the reflection prompt
const reflectionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert content reviewer tasked with evaluating and improving various types of content.
Analyze the given content considering its category, topic, and intended format (e.g., essay, article, tweet thread).
Provide a detailed critique and actionable recommendations to enhance the content's quality, relevance, and effectiveness.
Consider aspects such as structure, style, depth, clarity, and engagement appropriate for the content type.`,
  ],
  new MessagesPlaceholder('messages'),
]);

// Create the reflection chain using the reflection prompt and the structured model
const reflect = reflectionPrompt.pipe(reflectLlm);

// Define the web search tool
const webSearchTool = tool(
  async input => {
    const API_KEY = process.env.SERPAPI_API_KEY;
    if (!API_KEY) {
      console.error('SERPAPI_API_KEY is not set.');
      return 'Error: SERPAPI_API_KEY is not set.';
    }
    const query = input.query;
    const params = new URLSearchParams({
      api_key: API_KEY,
      engine: 'google',
      q: query,
      num: '3',
    });

    const url = `https://serpapi.com/search?${params.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const results = data.organic_results || [];

      if (!results.length) {
        return 'No results found.';
      }

      const snippets = results
        .map((result: any) => {
          return `${result.title}\n${result.snippet}\n${result.link}`;
        })
        .join('\n\n');

      return snippets;
    } catch (error) {
      console.error('Error performing web search:', error);
      return 'Error performing web search.';
    }
  },
  {
    name: 'web_search',
    description: 'Perform a web search for up-to-date information.',
    schema: z.object({
      query: z.string().describe('The search query string.'),
    }),
  }
);

// Create a list of tools
const tools = [webSearchTool];
// Create the ToolNode with the tools
const toolNode = new ToolNode(tools);

// Define the research decision schema
const researchDecisionSchema = z.object({
  decision: z.enum(['yes', 'no']).describe('Whether to perform research or not.'),
  reason: z.string().describe('Reason for the decision.'),
});

// Configure the research decision model
const researchDecisionLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.2,
}).withStructuredOutput(researchDecisionSchema);

// Create the research decision prompt
const researchDecisionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an assistant that decides if a topic would benefit from web-based research.
If the topic is about recent events, data, or factual information that might have changed recently, it would benefit from research.
Respond with a decision (yes/no) and a brief reason for your decision.`,
  ],
  new MessagesPlaceholder('messages'),
]);

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
    console.log(`WriterAgent - Iteration ${iterationCount}:`, event);
    iterationCount++;
    if (event.generate) {
      const aiMessages = event.generate.messages.filter((msg: BaseMessage) => msg._getType() === 'ai');
      if (aiMessages.length > 0) {
        const parsedContent = JSON.parse(aiMessages[aiMessages.length - 1].content);
        finalContent = parsedContent.content;
        if (parsedContent.other) {
          console.log('Additional information:', parsedContent.other);
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
