import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage, MessageContent } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import { WriterAgentParams, WriterAgentOutput } from './types';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { webSearchTool } from './tools';
import { generationSchema, reflectionSchema, researchDecisionSchema } from './schemas';
import { generationPrompt, reflectionPrompt, researchDecisionPrompt } from './prompts';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import logger from './logger';
import { humanFeedbackPrompt } from './prompts';
import { humanFeedbackSchema } from './schemas';

// Load environment variables
dotenv.config();

const MODEL = 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

// Configure the human feedback model
const humanFeedbackLlm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: MODEL,
  temperature: 0.4,
}).withStructuredOutput(humanFeedbackSchema);

// Create the human feedback chain
const humanFeedbackChain = humanFeedbackPrompt.pipe(humanFeedbackLlm);

// Update the State interface
const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  reflectionScore: Annotation<number>(),
  researchPerformed: Annotation<boolean>(),
  research: Annotation<string>(),
  reflections: Annotation<{ critique: string; score: number }[]>({
    reducer: (x, y) => x.concat(y),
  }),
  drafts: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  feedbackHistory: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const researchNode = async (state: typeof State.State) => {
  logger.info('Research Node - Starting research decision process');
  const decisionResponse = await researchDecisionChain.invoke({ messages: state.messages });
  logger.info(`Research Decision: ${decisionResponse.decision}`);

  if (decisionResponse.decision === 'yes') {
    logger.info('Performing web search');
    const query = decisionResponse.query || '';
    logger.info(`Using search query: ${query}`);

    const toolResponse = await toolNode.invoke({
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [{ name: 'web_search', args: { query }, id: 'tool_call_id', type: 'tool_call' }],
        }),
      ],
    });
    logger.info('Web search completed');
    const researchReport = await createResearchReport(toolResponse.messages[0].content);
    logger.info('Research report generated');
    return {
      messages: [new HumanMessage({ content: `Research findings:\n${researchReport}` })],
      researchPerformed: true,
      research: researchReport,
    };
  } else {
    logger.info('No research needed');
    return { researchPerformed: false, research: '' };
  }
};

async function createResearchReport(searchResults: string): Promise<MessageContent> {
  const reportPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a research assistant tasked with creating a comprehensive research report based on web search results. 
    Analyze the provided search results and create a well-structured report that includes:
    1. An executive summary
    2. Key findings
    3. Detailed analysis of each relevant source
    4. Potential biases or limitations in the research
    5. Conclusions and recommendations for further research
    
    Ensure the report is objective, well-organized, and provides valuable insights on the topic.`,
    ],
    [
      'human',
      `Here are the search results:\n\n{searchResults}\n\nPlease create a research report based on these results.`,
    ],
  ]);

  const reportChain = reportPrompt.pipe(
    new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: MODEL,
      temperature: 0.2,
      maxTokens: 2000,
    })
  );

  const response = await reportChain.invoke({ searchResults });
  return response.content;
}

const generationNode = async (state: typeof State.State) => {
  logger.info('Generation Node - Starting content generation');
  const response = await contentGenerationChain.invoke({ messages: state.messages });
  logger.info('Content generation completed');
  return {
    messages: [new AIMessage({ content: JSON.stringify(response) })],
    drafts: [response.generatedContent],
  };
};

const reflectionNode = async (state: typeof State.State) => {
  logger.info('Reflection Node - Starting content reflection');
  const clsMap: { [key: string]: new (content: string) => BaseMessage } = {
    ai: HumanMessage,
    human: AIMessage,
  };
  const translated = [
    state.messages[0],
    ...state.messages.slice(1).map(msg => new clsMap[msg._getType()](msg.content.toString())),
  ];
  const res = await reflect.invoke({ messages: translated });
  logger.info(`Reflection completed. Score: ${res.score}`);
  return {
    messages: [new HumanMessage({ content: res.critique })],
    reflectionScore: res.score,
    reflections: [{ critique: res.critique, score: res.score }],
  };
};

const humanFeedbackNode = async (state: typeof State.State) => {
  logger.info('Human Feedback Node - Processing feedback');
  const lastDraft = state.drafts[state.drafts.length - 1];
  const feedback = state.messages[state.messages.length - 1].content;

  const response = await humanFeedbackChain.invoke({
    messages: [
      new HumanMessage({
        content: `Original content:\n${lastDraft}\n\nHuman feedback:\n${feedback}`,
      }),
    ],
  });

  logger.info('Content updated based on human feedback');
  return {
    messages: [new AIMessage({ content: JSON.stringify(response) })],
    drafts: [response.improvedContent],
    feedbackHistory: [feedback],
  };
};

const shouldContinue = (state: typeof State.State) => {
  const { reflectionScore } = state;
  const lastMessage = state.messages[state.messages.length - 1];

  // If there's human feedback, process it
  if (lastMessage._getType() === 'human' &&
    typeof lastMessage.content === 'string' &&
    lastMessage.content.includes('FEEDBACK:')) {
    return 'processFeedback';
  }

  // Original logic
  if (reflectionScore >= 9 || state.messages.length > 10) {
    return END;
  }
  return 'reflect';
};

// Update the workflow
const workflow = new StateGraph(State)
  .addNode('researchNode', researchNode)
  .addNode('generate', generationNode)
  .addNode('reflect', reflectionNode)
  .addNode('processFeedback', humanFeedbackNode)
  .addEdge(START, 'researchNode')
  .addEdge('researchNode', 'generate')
  .addConditionalEdges('generate', shouldContinue)
  .addEdge('reflect', 'generate')
  .addEdge('processFeedback', 'generate');

const app = workflow.compile({ checkpointer: new MemorySaver() });

// Add these interfaces
interface ThreadState {
  state: typeof State.State;
  stream: any;
}

// Add a map to store thread states
const threadStates = new Map<string, ThreadState>();

// Split the writerAgent into two exported functions
export const writerAgent = {
  async startDraft({
    category,
    topic,
    contentType,
    otherInstructions,
  }: Omit<WriterAgentParams, 'humanFeedback'>): Promise<WriterAgentOutput & { threadId: string }> {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    logger.info('WriterAgent - Starting new draft', { threadId });

    const instructions = `Create ${contentType} content. Category: ${category}. Topic: ${topic}. ${otherInstructions}`;
    const initialState = {
      messages: [new HumanMessage({ content: instructions })],
      reflectionScore: 0,
      researchPerformed: false,
      research: '',
      reflections: [],
      drafts: [],
      feedbackHistory: [],
    };

    const stream = await app.stream(initialState, { configurable: { thread_id: threadId } });

    // Store the state and stream for later use
    threadStates.set(threadId, {
      state: initialState,
      stream,
    });

    const result = await processStream(stream);
    return { ...result, threadId };
  },

  async continueDraft({
    threadId,
    feedback,
  }: {
    threadId: string;
    feedback: string;
  }): Promise<WriterAgentOutput> {
    const threadState = threadStates.get(threadId);
    if (!threadState) {
      throw new Error('Thread not found');
    }

    logger.info('WriterAgent - Continuing draft with feedback', { threadId });

    // Add feedback to the existing state
    const newMessage = new HumanMessage({ content: `FEEDBACK: ${feedback}` });
    threadState.state.messages.push(newMessage);

    // Continue the stream with the updated state
    const stream = await app.stream(threadState.state, { configurable: { thread_id: threadId } });

    // Update the stored state
    threadStates.set(threadId, {
      state: threadState.state,
      stream,
    });

    return await processStream(stream);
  }
};

// Helper function to process the stream
async function processStream(stream: any): Promise<WriterAgentOutput> {
  let finalContent = '';
  let research = '';
  let reflections: { critique: string; score: number }[] = [];
  let drafts: string[] = [];
  let feedbackHistory: string[] = [];
  let iterationCount = 0;

  for await (const event of stream) {
    logger.info(`WriterAgent - Iteration ${iterationCount} completed`);
    iterationCount++;
    if (event.researchNode) {
      research = event.researchNode.research || '';
      logger.info('Research step completed');
    }
    if (event.generate) {
      const aiMessages = event.generate.messages.filter((msg: BaseMessage) => msg._getType() === 'ai');
      if (aiMessages.length > 0) {
        try {
          const parsedContent = JSON.parse(aiMessages[aiMessages.length - 1].content);
          if (parsedContent.generatedContent) {
            finalContent = parsedContent.generatedContent;
            drafts.push(finalContent);
            logger.info('New content draft generated');
          }
        } catch (error) {
          logger.error('WriterAgent - Error parsing AI message content:', error);
        }
      }
    }
    if (event.reflect) {
      reflections.push({
        critique: event.reflect.messages[0].content,
        score: event.reflect.reflectionScore,
      });
      logger.info(`Reflection added. Score: ${event.reflect.reflectionScore}`);
    }
    if (event.processFeedback) {
      feedbackHistory.push(event.processFeedback.feedbackHistory[0]);
      logger.info(`Feedback added. History: ${event.processFeedback.feedbackHistory}`);
    }
  }

  logger.info('WriterAgent - Content generation process completed');
  if (!finalContent) {
    logger.error('WriterAgent - No content was generated');
    throw new Error('Failed to generate content');
  }

  return {
    finalContent,
    research,
    reflections,
    drafts,
    feedbackHistory,
  };
}
