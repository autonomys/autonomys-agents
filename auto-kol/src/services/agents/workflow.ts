import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { config } from '../../config';
import { createLogger } from '../../utils/logger';
import { Tweet } from '../../types/twitter';
import {
    EngagementDecision,
    ToneAnalysis,
    ResponseAlternative,
    ResponseSelection,
    WorkflowState
} from '../../types/workflow';

const logger = createLogger('agent-workflow');

// State management
const State = Annotation.Root({
    tweet: Annotation<Tweet>(),
    messages: Annotation<BaseMessage[]>({
        reducer: (curr, prev) => [...curr, ...prev],
        default: () => [],
    }),
    engagementDecision: Annotation<EngagementDecision | undefined>(),
    toneAnalysis: Annotation<ToneAnalysis | undefined>(),
    alternatives: Annotation<ResponseAlternative[]>({
        reducer: (curr, prev) => [...curr, ...prev],
        default: () => [],
    }),
    selectedResponse: Annotation<ResponseSelection | undefined>(),
    previousInteractions: Annotation<readonly string[]>({
        reducer: (curr, prev) => [...curr, ...prev],
        default: () => [],
    }),
});

// LLM instances
const decisionLLM = new ChatOpenAI({
    modelName: config.LLM_MODEL,
    temperature: 0.2,
});

const creativeLLM = new ChatOpenAI({
    modelName: config.LLM_MODEL,
    temperature: 0.8,
});

const analyticLLM = new ChatOpenAI({
    modelName: config.LLM_MODEL,
    temperature: 0.3,
});

// Engagement Decision Node
const engagementPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a strategic social media engagement advisor. 
    Evaluate tweets and decide whether they warrant a response based on:
    1. Relevance to AI, blockchain, or tech innovation
    2. Potential for meaningful discussion
    3. Author's influence and engagement level
    4. Tweet's recency and context
    5. Our recent interaction history with the author
    
    Provide a structured decision with reasoning and priority level (1-10).`],
    ["human", `Tweet: {tweet}\nPrevious interactions: {previousInteractions}\n\nShould we engage with this tweet?`]
]);

const engagementNode = async (state: typeof State.State) => {
    logger.info('Engagement Node - Evaluating tweet engagement');
    try {
        const response = await engagementPrompt
            .pipe(decisionLLM)
            .invoke({
                tweet: state.tweet.text,
                previousInteractions: state.previousInteractions.join('\n')
            });
        const content = response.content as string;
        const decision: EngagementDecision = {
            shouldEngage: content.toLowerCase().includes('yes'),
            reason: content,
            priority: parseInt(content.match(/priority.*?(\d+)/i)?.[1] || '5')
        };

        return {
            messages: [response],
            engagementDecision: decision
        };
    } catch (error) {
        logger.error('Error in engagement decision:', error);
        throw error;
    }
};

// Tone Analysis Node
const tonePrompt = ChatPromptTemplate.fromMessages([
    ["system", `Analyze the tone and context of the tweet to determine:
    1. The dominant tone of the original tweet
    2. The most appropriate tone for our response
    3. Detailed reasoning for the suggested tone
    
    Consider the author's status, tweet context, and topic sensitivity.`],
    ["human", `Tweet: {tweet}\nEngagement Decision: {decision}\n\nAnalyze the tone and suggest response approach:`]
]);

const toneAnalysisNode = async (state: typeof State.State) => {
    logger.info('Tone Analysis Node - Analyzing tweet tone');
    try {
        const response = await tonePrompt
            .pipe(analyticLLM)
            .invoke({
                tweet: state.tweet.text,
                decision: state.engagementDecision?.reason
            });
        const content = response.content as string;
        const analysis: ToneAnalysis = {
            dominantTone: content.match(/dominant tone:.*?([a-z]+)/i)?.[1] || 'neutral',
            suggestedTone: content.match(/suggested tone:.*?([a-z]+)/i)?.[1] || 'neutral',
            reasoning: content
        };

        return {
            messages: [response],
            toneAnalysis: analysis
        };
    } catch (error) {
        logger.error('Error in tone analysis:', error);
        throw error;
    }
};

// Response Generation Node
const responsePrompt = ChatPromptTemplate.fromMessages([
    ["system", `Generate three distinct response alternatives that:
    1. Match the suggested tone
    2. Are thought-provoking and engaging
    3. Stay within Twitter's character limit
    4. Include relevant hashtags when appropriate
    
    For each alternative, provide the response, tone used, strategy employed, and estimated impact (1-10).`],
    ["human", `Tweet: {tweet}\nTone Analysis: {toneAnalysis}\n\nGenerate response alternatives:`]
]);

const responseGenerationNode = async (state: typeof State.State) => {
    logger.info('Response Generation Node - Creating alternatives');
    try {
        const response = await responsePrompt
            .pipe(creativeLLM)
            .invoke({
                tweet: state.tweet.text,
                toneAnalysis: state.toneAnalysis?.reasoning
            });
        const content = response.content as string;

        // Parse alternatives from the response
        const alternatives: ResponseAlternative[] = content
            .split(/Alternative \d+:/g)
            .filter(Boolean)
            .map(alt => ({
                content: alt.match(/Content: (.*?)(?=\n|$)/)?.[1] || '',
                tone: alt.match(/Tone: (.*?)(?=\n|$)/)?.[1] || '',
                strategy: alt.match(/Strategy: (.*?)(?=\n|$)/)?.[1] || '',
                estimatedImpact: parseInt(alt.match(/Impact: (\d+)/)?.[1] || '5')
            }));

        return {
            messages: [response],
            alternatives
        };
    } catch (error) {
        logger.error('Error generating responses:', error);
        throw error;
    }
};

// Response Selection Node
const selectionPrompt = ChatPromptTemplate.fromMessages([
    ["system", `Select the most appropriate response alternative based on:
    1. Alignment with our engagement goals
    2. Appropriateness of tone and content
    3. Potential for positive engagement
    4. Risk assessment
    
    Provide detailed reasoning for the selection and confidence level (0-1).`],
    ["human", `Tweet: {tweet}\nAlternatives: {alternatives}\n\nSelect the best response:`]
]);

const responseSelectionNode = async (state: typeof State.State) => {
    logger.info('Response Selection Node - Choosing best response');
    try {
        const response = await selectionPrompt
            .pipe(analyticLLM)
            .invoke({
                tweet: state.tweet.text,
                alternatives: JSON.stringify(state.alternatives)
            });
        const content = response.content as string;
        const selection: ResponseSelection = {
            selectedResponse: state.alternatives?.[0]?.content || '',  // Default to first if parsing fails
            reasoning: content,
            confidence: parseFloat(content.match(/confidence:?\s*(0\.\d+)/i)?.[1] || '0.5')
        };

        return {
            messages: [response],
            selectedResponse: selection
        };
    } catch (error) {
        logger.error('Error selecting response:', error);
        throw error;
    }
};

// Workflow Control
const shouldContinue = (state: typeof State.State) => {
    if (!state.engagementDecision?.shouldEngage) {
        logger.info('Ending workflow - Decided not to engage');
        return END;
    }

    if (!state.toneAnalysis) {
        return 'analyzeNode';
    }

    if (!state.alternatives?.length) {
        return 'generateNode';
    }

    if (!state.selectedResponse) {
        return 'selectNode';
    }

    return END;
};

// Create and export the workflow
const workflow = new StateGraph(State)
    .addNode('engagementNode', engagementNode)
    .addNode('analyzeNode', toneAnalysisNode)
    .addNode('generateNode', responseGenerationNode)
    .addNode('selectNode', responseSelectionNode)
    .addEdge(START, 'engagementNode')
    .addConditionalEdges('engagementNode', shouldContinue)
    .addEdge('analyzeNode', 'generateNode')
    .addEdge('generateNode', 'selectNode')
    .addConditionalEdges('selectNode', shouldContinue);

const memoryStore = new MemorySaver();
export const app = workflow.compile({ checkpointer: memoryStore });

export const runWorkflow = async (
    tweet: Tweet,
    previousInteractions: string[] = []
): Promise<WorkflowState> => {
    const threadId = `tweet_${tweet.id}_${Date.now()}`;
    logger.info('Starting tweet response workflow', { threadId, tweetId: tweet.id });

    const initialState = {
        tweet,
        messages: [],
        previousInteractions
    };

    // Add configurable with thread_id
    const config = {
        configurable: {
            thread_id: threadId
        }
    };

    const stream = await app.stream(initialState, config);  // Pass config here
    let finalState: WorkflowState = initialState;

    for await (const state of stream) {
        finalState = state;
    }

    logger.info('Workflow completed', {
        threadId,
        tweetId: tweet.id,
        shouldEngage: finalState.engagementDecision?.shouldEngage,
        selectedResponse: finalState.selectedResponse?.selectedResponse
    });

    return finalState;
};