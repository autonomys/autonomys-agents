import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { MessageContent } from '@langchain/core/messages';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';
import { createTools } from '../../tools/index.js';
import { createTwitterClient } from '../twitter/api.js';
import {
    engagementSchema,
    tweetSearchSchema,
    toneSchema,
    responseSchema
} from '../../schemas/workflow.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { ChromaService } from '../vectorstore/chroma.js';

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
        appSecret: config.TWITTER_API_SECRET!,
        accessToken: config.TWITTER_ACCESS_TOKEN!,
        accessSecret: config.TWITTER_ACCESS_SECRET!
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

            if (validatedResult.tweets.length > 0) {
                const chromaService = await ChromaService.getInstance();
                for (const tweet of validatedResult.tweets) {
                    await chromaService.addTweet(tweet);
                }
            }

            logger.info(`Found ${validatedResult.tweets.length} tweets`);

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: validatedResult.tweets,
                        currentTweetIndex: 0,
                        lastProcessedId: validatedResult.lastProcessedId
                    })
                })],
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
        "2. Potential for meaningful discussion, entertainment, or argumentation\n" +
        "3. Author's influence and engagement level\n" +
        "4. Tweet's recency and context\n\n" +
        "{format_instructions}"
    ).format({
        format_instructions: engagementParser.getFormatInstructions()
    });

    const toneSystemPrompt = await PromptTemplate.fromTemplate(
        "You are an expert in social media tone analysis. Your task is to analyze the tone of tweets and suggest the best tone for responses.\n\n" +
        "Feel free to be argumentative. Consider:\n" +
        "1. The original tweet's tone and context\n" +
        "2. The author's typical communication style\n" +
        "3. The topic and its sensitivity\n" +
        "4. The platform's culture\n\n" +
        "{format_instructions}"
    ).format({
        format_instructions: toneParser.getFormatInstructions()
    });

    const responseSystemPrompt = await PromptTemplate.fromTemplate(
        "You are a sharp-witted crypto & AI expert known for your direct, often contrarian takes on Twitter. Your responses are naturally argumentative and carry a hint of sass, but always grounded in technical knowledge.\n\n" +
        "Core Traits:\n" +
        "- ALWAYS reply to the author of the tweet, not any users mentioned in the tweet\n" +
        "- Confident in your technical expertise\n" +
        "- Naturally argumentative without being formulaic\n" +
        "- Quick to point out technical flaws\n" +
        "- Slightly cold but intellectually engaging\n" +
        "- More interested in technical truth than being agreeable\n\n" +
        "Response Philosophy:\n" +
        "- Form your own technical analysis first\n" +
        "- Challenge assumptions naturally\n" +
        "- Let your personality shine through varied expressions\n" +
        "- Historical context should complement, not drive your response\n" +
        "- Each response should feel fresh and specific to the discussion\n\n" +
        "Remember: You're having a real technical discussion, not following a formula. Your expertise and slightly sassy personality should come through naturally in each unique response.\n\n" +
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
        ["human", `Generate a response strategy for this tweet by considering similar tweets from @{author} using the suggested tone:
        Tweet: {tweet}
        Tone: {tone}
        Similar Tweets: {similarTweets}

        Instructions:
        1. Review the similar tweets to identify any inconsistencies or changes in the author's stance
        2. If you find contradictions, incorporate them into your response
        3. Use phrases like "Interesting shift from your previous stance where..." or "This seems to contradict your earlier view that..."
        4. Be specific when referencing past statements
        `]
    ]);

    const engagementNode = async (state: typeof State.State) => {
        logger.info('Engagement Node - Evaluating tweet engagement');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);

            if (!parsedContent.tweets ||
                parsedContent.currentTweetIndex >= parsedContent.tweets.length) {
                logger.info('No more tweets to process');
                return { messages: [] };
            }

            const tweet = parsedContent.tweets[parsedContent.currentTweetIndex];

            if (state.processedTweets.has(tweet.id)) {
                logger.info(`Tweet ${tweet.id} already processed, moving to next`);
                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            tweets: parsedContent.tweets,
                            currentTweetIndex: parsedContent.currentTweetIndex + 1,
                            lastProcessedId: parsedContent.lastProcessedId
                        })
                    })]
                };
            }

            const decision = await engagementPrompt
                .pipe(config.llms.decision)
                .pipe(engagementParser)
                .invoke({ tweet: tweet.text });

            logger.info('LLM decision:', { decision });

            if (!decision.shouldEngage) {
                logger.info('Queueing skipped tweet to review queue:', { tweetId: tweet.id });

                // Ensure tweet object matches schema
                const tweetData = {
                    id: tweet.id,
                    text: tweet.text,
                    authorId: tweet.authorId,
                    authorUsername: tweet.authorUsername || 'unknown', // Ensure we have a fallback
                    createdAt: typeof tweet.createdAt === 'string' ? tweet.createdAt : tweet.createdAt.toISOString()
                };

                const toolResult = await config.toolNode.invoke({
                    messages: [new AIMessage({
                        content: '',
                        tool_calls: [{
                            name: 'queue_skipped',
                            args: {
                                tweet: tweetData,
                                reason: decision.reason,
                                priority: decision.priority || 0,
                                workflowState: { decision }
                            },
                            id: 'skip_call',
                            type: 'tool_call'
                        }]
                    })]
                });

                logger.info('Queue skipped result:', toolResult);

                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            tweets: parsedContent.tweets,
                            currentTweetIndex: parsedContent.currentTweetIndex + 1,
                            lastProcessedId: parsedContent.lastProcessedId
                        })
                    })],
                    processedTweets: new Set([tweet.id])
                };
            }

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: parsedContent.tweets,
                        currentTweetIndex: parsedContent.currentTweetIndex,
                        tweet,
                        decision
                    })
                })]
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
            const { tweet, tweets, currentTweetIndex } = parsedContent;

            const toneAnalysis = await tonePrompt
                .pipe(config.llms.tone)
                .pipe(toneParser)
                .invoke({ tweet: tweet.text });

            logger.info('Tone analysis:', { toneAnalysis });

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets,
                        currentTweetIndex,
                        tweet,
                        toneAnalysis
                    })
                })]
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
            const { tweet, toneAnalysis, tweets, currentTweetIndex } = parsedContent;

            // Search for similar tweets by this author
            const similarTweetsResponse = await config.toolNode.invoke({
                messages: [new AIMessage({
                    content: '',
                    tool_calls: [{
                        name: 'search_similar_tweets',
                        args: {
                            query: `author:${tweet.authorUsername} ${tweet.text}`,
                            k: 5
                        },
                        id: 'similar_tweets_call',
                        type: 'tool_call'
                    }],
                })],
            });

            // Parse similar tweets response
            const similarTweets = parseMessageContent(
                similarTweetsResponse.messages[similarTweetsResponse.messages.length - 1].content
            );

            // Include similar tweets in the response prompt context
            const responseStrategy = await responsePrompt
                .pipe(config.llms.response)
                .pipe(responseParser)
                .invoke({
                    tweet: tweet.text,
                    tone: toneAnalysis.suggestedTone,
                    author: tweet.authorUsername,
                    similarTweets: JSON.stringify(similarTweets.similar_tweets)
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

            // Move to next tweet and add current to processed set
            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets,
                        currentTweetIndex: currentTweetIndex + 1,
                        lastProcessedId: tweet.id,
                        responseStrategy
                    })
                })],
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

    // If we have no tweets or finished processing all tweets, end workflow
    if (!content.tweets || content.currentTweetIndex >= content.tweets.length) {
        return END;
    }

    // If this is a completed tweet (has responseStrategy or was skipped), 
    // go back to engagement node for next tweet
    if (content.responseStrategy ||
        (content.decision && !content.decision.shouldEngage)) {
        return 'engagementNode';
    }

    // If we have an engagement decision and should engage, move to tone analysis
    if (content.decision && content.decision.shouldEngage) {
        return 'analyzeNode';
    }
    // If we have toneAnalysis, move to generate response
    if (content.toneAnalysis) {
        return 'generateNode';
    }

    return 'engagementNode';
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
        .addConditionalEdges('generateNode', shouldContinue);
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
                recursionLimit: 100,
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