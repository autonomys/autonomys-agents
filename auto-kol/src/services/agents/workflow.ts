import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { MessageContent } from '@langchain/core/messages';
import { config } from '../../config';
import { createLogger } from '../../utils/logger';
import { createTools } from '../../tools';
import { createTwitterClient } from '../twitter/api';
import {
    engagementSchema,
    tweetSearchSchema,
    toneSchema,
    responseSchema
} from '../../schemas/workflow';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { StructuredOutputParser } from 'langchain/output_parsers';

const logger = createLogger('agent-workflow');

const parseMessageContent = (content: MessageContent): any => {
    if (typeof content === 'string') {
        return JSON.parse(content);
    }
    if (Array.isArray(content)) {
        return JSON.parse(JSON.stringify(content));
    }
    return content;
};

// State management with processed tweets tracking
const State = Annotation.Root({
    messages: Annotation<readonly BaseMessage[]>({
        reducer: (curr, prev) => [...curr, ...prev],
        default: () => [],
    }),
    processedTweets: Annotation<ReadonlySet<string>>({
        default: () => new Set(),
        reducer: (curr, prev) => new Set([...curr, ...prev]),
    }),
    lastProcessedId: Annotation<string | undefined>(),
});

// Workflow configuration type
type WorkflowConfig = Readonly<{
    client: TwitterApiReadWrite;
    toolNode: ToolNode;
    llms: Readonly<{
        decision: ChatOpenAI;
        tone: ChatOpenAI;
        response: ChatOpenAI;
    }>;
}>;

// Create workflow configuration
const createWorkflowConfig = async (): Promise<WorkflowConfig> => {
    const client = await createTwitterClient({
        appKey: config.TWITTER_API_KEY!,
        appSecret: config.TWITTER_API_SECRET!
    });

    const { tools } = createTools(client);

    return {
        client,
        toolNode: new ToolNode(tools),
        llms: {
            decision: new ChatOpenAI({
                modelName: config.LLM_MODEL,
                temperature: 0.2,
            }) as unknown as ChatOpenAI,

            tone: new ChatOpenAI({
                modelName: config.LLM_MODEL,
                temperature: 0.3,
            }) as unknown as ChatOpenAI,

            response: new ChatOpenAI({
                modelName: config.LLM_MODEL,
                temperature: 0.8,
            }) as unknown as ChatOpenAI
        }
    };
};

// Node factory functions
const createNodes = async (config: WorkflowConfig) => {
    const searchNode = async (state: typeof State.State) => {
        logger.info('Search Node - Fetching recent tweets');
        try {
            logger.info('Last processed id:', state.lastProcessedId);

            const toolResponse = await config.toolNode.invoke({
                messages: [
                    new AIMessage({
                        content: '',
                        tool_calls: [{
                            name: 'search_recent_tweets',
                            args: {
                                lastProcessedId: state.lastProcessedId || undefined
                            },
                            id: 'tool_call_id',
                            type: 'tool_call'
                        }],
                    }),
                ],
            });

            // Log the tool response
            logger.info('Tool response received:', {
                messageCount: toolResponse.messages.length,
                lastMessageContent: toolResponse.messages[toolResponse.messages.length - 1].content
            });

            // The tool response will be in the last message's content
            const lastMessage = toolResponse.messages[toolResponse.messages.length - 1];

            // Handle different types of content
            let searchResult;
            if (typeof lastMessage.content === 'string') {
                try {
                    searchResult = JSON.parse(lastMessage.content);
                    logger.info('Parsed search result:', searchResult);
                } catch (error) {
                    logger.error('Failed to parse search result:', error);
                    searchResult = { tweets: [], lastProcessedId: null };
                }
            } else {
                searchResult = lastMessage.content;
                logger.info('Non-string search result:', searchResult);
            }

            // Validate the search result
            const validatedResult = tweetSearchSchema.parse(searchResult);

            logger.info(`Found ${validatedResult.tweets.length} tweets`);

            return {
                messages: [new AIMessage({ content: JSON.stringify(validatedResult) })],
                lastProcessedId: validatedResult.lastProcessedId || undefined
            };
        } catch (error) {
            logger.error('Error in search node:', error);
            // Return a valid empty result
            const emptyResult = {
                tweets: [],
                lastProcessedId: null
            };
            return {
                messages: [new AIMessage({ content: JSON.stringify(emptyResult) })],
                lastProcessedId: undefined
            };
        }
    };

    const engagementParser = StructuredOutputParser.fromZodSchema(engagementSchema);
    const toneParser = StructuredOutputParser.fromZodSchema(toneSchema);
    const responseParser = StructuredOutputParser.fromZodSchema(responseSchema);

    const engagementSystemPrompt = await PromptTemplate.fromTemplate(
        "You are a strategic social media engagement advisor. Your task is to evaluate tweets and decide whether they warrant a response.\n\n" +
        "Evaluate each tweet based on:\n" +
        "1. Relevance to AI, blockchain, or tech innovation\n" +
        "2. Potential for meaningful discussion\n" +
        "3. Author's influence and engagement level\n" +
        "4. Tweet's recency and context\n\n" +
        "{format_instructions}"
    ).format({
        format_instructions: engagementParser.getFormatInstructions()
    });

    const toneSystemPrompt = await PromptTemplate.fromTemplate(
        "You are an expert in social media tone analysis. Your task is to analyze the tone of tweets and suggest the best tone for responses.\n\n" +
        "Consider:\n" +
        "1. The original tweet's tone and context\n" +
        "2. The author's typical communication style\n" +
        "3. The topic and its sensitivity\n" +
        "4. The platform's culture\n\n" +
        "{format_instructions}"
    ).format({
        format_instructions: toneParser.getFormatInstructions()
    });

    const responseSystemPrompt = await PromptTemplate.fromTemplate(
        "You are an expert in crafting engaging social media responses. Your task is to generate response strategies for tweets.\n\n" +
        "Consider:\n" +
        "1. The original tweet's content and tone\n" +
        "2. The suggested response tone\n" +
        "3. The engagement goals\n" +
        "4. Platform best practices\n\n" +
        "{format_instructions}"
    ).format({
        format_instructions: responseParser.getFormatInstructions()
    });

    const engagementPrompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(engagementSystemPrompt),
        ["human", "Evaluate this tweet and provide your structured decision: {tweet}"]
    ]);

    const tonePrompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(toneSystemPrompt),
        ["human", "Analyze the tone for this tweet and suggest a response tone: {tweet}"]
    ]);

    const responsePrompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(responseSystemPrompt),
        ["human", "Generate a response strategy for this tweet using the suggested tone: {tweet} {tone}"]
    ]);

    const engagementNode = async (state: typeof State.State) => {
        logger.info('Engagement Node - Evaluating tweet engagement');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);

            if (!parsedContent.tweets || parsedContent.tweets.length === 0) {
                logger.info('No tweets to process');
                return { messages: [] };
            }

            const tweet = parsedContent.tweets[0];

            if (state.processedTweets.has(tweet.id)) {
                logger.info(`Tweet ${tweet.id} already processed, skipping`);
                return { messages: [] };
            }

            const decision = await engagementPrompt
                .pipe(config.llms.decision)
                .pipe(engagementParser)
                .invoke({ tweet: tweet.text });

            logger.info('LLM decision:', { decision });

            if (!decision.shouldEngage) {
                await config.toolNode.invoke({
                    messages: [new AIMessage({
                        content: '',
                        tool_calls: [{
                            name: 'queue_skipped',
                            args: {
                                tweet,
                                reason: decision.reason,
                                priority: decision.priority,
                                workflowState: { decision }
                            },
                            id: 'skip_call',
                            type: 'tool_call'
                        }]
                    })]
                });

                return {
                    messages: [new AIMessage({ content: JSON.stringify(decision) })],
                    processedTweets: new Set([tweet.id])
                };
            }

            return {
                messages: [new AIMessage({ content: JSON.stringify({ tweet, decision }) })]
            };
        } catch (error) {
            logger.error('Error in engagement node:', error);
            return { messages: [] };
        }
    };

    const toneAnalysisNode = async (state: typeof State.State) => {
        logger.info('Tone Analysis Node - Analyzing tweet tone');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const { tweet } = parsedContent;

            const toneAnalysis = await tonePrompt
                .pipe(config.llms.tone)
                .pipe(toneParser)
                .invoke({ tweet: tweet.text });

            logger.info('Tone analysis:', { toneAnalysis });

            return {
                messages: [new AIMessage({ content: JSON.stringify({ tweet, toneAnalysis }) })]
            };
        } catch (error) {
            logger.error('Error in tone analysis node:', error);
            return { messages: [] };
        }
    };

    const responseGenerationNode = async (state: typeof State.State) => {
        logger.info('Response Generation Node - Creating response strategy');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const { tweet, toneAnalysis } = parsedContent;

            const responseStrategy = await responsePrompt
                .pipe(config.llms.response)
                .pipe(responseParser)
                .invoke({
                    tweet: tweet.text,
                    tone: toneAnalysis.suggestedTone
                });

            logger.info('Response strategy:', { responseStrategy });

            // Queue the response
            await config.toolNode.invoke({
                messages: [new AIMessage({
                    content: '',
                    tool_calls: [{
                        name: 'queue_response',
                        args: {
                            tweet,
                            response: responseStrategy.content,
                            workflowState: {
                                toneAnalysis,
                                responseStrategy
                            }
                        },
                        id: 'queue_response_call',
                        type: 'tool_call'
                    }]
                })]
            });

            // Add tweet to processed set and return state update
            return {
                messages: [new AIMessage({ content: JSON.stringify({ tweet, toneAnalysis, responseStrategy }) })],
                processedTweets: new Set([tweet.id])
            };
        } catch (error) {
            logger.error('Error in response generation node:', error);
            return { messages: [] };
        }
    };

    return {
        searchNode,
        engagementNode,
        toneAnalysisNode,
        responseGenerationNode
    };
};

const shouldContinue = (state: typeof State.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = parseMessageContent(lastMessage.content);

    // If we have a responseStrategy, we've completed the workflow for this tweet
    if (content.responseStrategy) {
        return END;
    }

    // If engagement decision is false, end the workflow
    if (content.decision && !content.decision.shouldEngage) {
        return END;
    }

    // If we have toneAnalysis, move to generate response
    if (content.toneAnalysis) {
        return 'generateNode';
    }

    // If we have an engagement decision and should engage, move to tone analysis
    if (content.decision && content.decision.shouldEngage) {
        return 'analyzeNode';
    }

    return END;
};

// Workflow creation function
const createWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
    return new StateGraph(State)
        .addNode('searchNode', nodes.searchNode)
        .addNode('engagementNode', nodes.engagementNode)
        .addNode('analyzeNode', nodes.toneAnalysisNode)
        .addNode('generateNode', nodes.responseGenerationNode)
        .addEdge(START, 'searchNode')
        .addEdge('searchNode', 'engagementNode')
        .addConditionalEdges('engagementNode', shouldContinue)
        .addConditionalEdges('analyzeNode', shouldContinue)
        .addConditionalEdges('generateNode', () => END);
};

// Workflow runner type
type WorkflowRunner = Readonly<{
    runWorkflow: () => Promise<unknown>;
}>;

// Create workflow runner
const createWorkflowRunner = async (): Promise<WorkflowRunner> => {
    const workflowConfig = await createWorkflowConfig();
    const nodes = await createNodes(workflowConfig);
    const workflow = await createWorkflow(nodes);
    const memoryStore = new MemorySaver();
    const app = workflow.compile({ checkpointer: memoryStore });

    return {
        runWorkflow: async () => {
            const threadId = `workflow_${Date.now()}`;
            logger.info('Starting tweet response workflow', { threadId });

            const config = {
                configurable: {
                    thread_id: threadId
                }
            };

            const stream = await app.stream({}, config);
            let finalState = {};

            for await (const state of stream) {
                finalState = state;
            }

            logger.info('Workflow completed', { threadId });
            return finalState;
        }
    };
};

// Export a single async function to get the workflow runner
export const getWorkflowRunner = (() => {
    let runnerPromise: Promise<WorkflowRunner> | null = null;

    return () => {
        if (!runnerPromise) {
            runnerPromise = createWorkflowRunner();
        }
        return runnerPromise;
    };
})();

// Export the run function for external use
export const runWorkflow = async () => {
    const runner = await getWorkflowRunner();
    return runner.runWorkflow();
};