import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage, MessageContent } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';
import { WriterAgentParams, WriterAgentOutput } from '../types';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { webSearchTool } from '../tools';
import { generationSchema, reflectionSchema, researchDecisionSchema, humanFeedbackSchema } from '../schemas';
import { generationPrompt, reflectionPrompt, researchDecisionPrompt, humanFeedbackPrompt } from '../prompts';
import logger from '../logger';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createThreadStorage } from './threadStorage';

// Create a list of tools and ToolNode instance
const tools = [webSearchTool];
const toolNode = new ToolNode(tools);

// Create the content generation chain
const generationLlm = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    model: config.model,
    temperature: config.llmConfig.generation.temperature,
    maxTokens: config.llmConfig.generation.maxTokens,
}).withStructuredOutput(generationSchema);

const contentGenerationChain = generationPrompt.pipe(generationLlm);

// Create the reflection chain
const reflectLlm = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    model: config.model,
    temperature: config.llmConfig.reflection.temperature,
    maxTokens: config.llmConfig.reflection.maxTokens,
}).withStructuredOutput(reflectionSchema);

const reflectionChain = reflectionPrompt.pipe(reflectLlm);

// Create the research decision chain
const researchDecisionLlm = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    model: config.model,
    temperature: config.llmConfig.research.temperature,
    maxTokens: config.llmConfig.research.maxTokens,
}).withStructuredOutput(researchDecisionSchema);

const researchDecisionChain = researchDecisionPrompt.pipe(researchDecisionLlm);

// Create the human feedback chain
const humanFeedbackLlm = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    model: config.model,
    temperature: config.llmConfig.feedback.temperature,
    maxTokens: config.llmConfig.feedback.maxTokens,
}).withStructuredOutput(humanFeedbackSchema);

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

const createResearchReport = async (searchResults: string): Promise<MessageContent> => {
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
            openAIApiKey: config.openaiApiKey,
            model: config.model,
            temperature: config.llmConfig.research.temperature,
            maxTokens: config.llmConfig.research.maxTokens,
        })
    );

    const response = await reportChain.invoke({ searchResults });
    return response.content;
}

const researchNode = async (state: typeof State.State) => {
    logger.info('Research Node - Starting research decision process');
    const decisionResponse = await researchDecisionChain.invoke({
        messages: state.messages  // Pass as an object with messages key
    });
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

const generationNode = async (state: typeof State.State) => {
    logger.info('Generation Node - Starting content generation');
    const response = await contentGenerationChain.invoke({
        messages: state.messages  // Pass as an object with messages key
    });
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
    const res = await reflectionChain.invoke({
        messages: translated  // Pass as an object with messages key
    });
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
        ]
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

// Create a persistent memory store
const memoryStore = new MemorySaver();

// Update the workflow compilation to use the memory store
const app = workflow.compile({
    checkpointer: memoryStore
});

// Add a type for thread state management
interface ThreadState {
    state: typeof State.State;
    lastOutput?: WriterAgentOutput;
}

// Initialize thread storage as a singleton
const threadStorage = createThreadStorage();

// Ensure thread storage is initialized before starting the server
export const initializeStorage = async () => {
    try {
        // Just check if we can connect to the database
        const threads = await threadStorage.getAllThreads();
        logger.info('Thread storage initialized successfully', { threadCount: threads.length });
    } catch (error) {
        logger.error('Failed to initialize thread storage:', error);
        throw error;
    }
};

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

        const config = {
            configurable: {
                thread_id: threadId
            }
        };

        const stream = await app.stream(initialState, config);
        const result = await processStream(stream);

        // Store thread state in persistent storage
        await threadStorage.saveThread(threadId, {
            state: initialState,
            lastOutput: result
        });

        return { ...result, threadId };
    },

    async continueDraft({
        threadId,
        feedback,
    }: {
        threadId: string;
        feedback: string;
    }): Promise<WriterAgentOutput> {
        // Load thread state from storage
        const threadState = await threadStorage.loadThread(threadId);
        if (!threadState) {
            logger.error('Thread not found', { threadId });
            throw new Error(`Thread ${threadId} not found`);
        }

        logger.info('WriterAgent - Continuing draft with feedback', { threadId });

        const newMessage = new HumanMessage({ content: `FEEDBACK: ${feedback}` });
        const updatedState = {
            ...threadState.state,
            messages: [...threadState.state.messages, newMessage]
        };

        const config = {
            configurable: {
                thread_id: threadId
            }
        };

        const stream = await app.stream(updatedState, config);
        const result = await processStream(stream);

        // Update thread state in storage
        await threadStorage.saveThread(threadId, {
            state: updatedState,
            lastOutput: result
        });

        return result;
    },

    async getThreadState(threadId: string): Promise<ThreadState | null> {
        return await threadStorage.loadThread(threadId);
    }
};

// Helper function to process the stream
const processStream = async (stream: any): Promise<WriterAgentOutput> => {
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
