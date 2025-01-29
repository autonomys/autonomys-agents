import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { summarizeResults } from '../../../tools/summarizerTool.js';
import { config as appConfig } from '../../../../config/index.js';

const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: appConfig.llmConfig.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });
  const inMemoryVectorStore = new MemoryVectorStore(embeddings);

  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    logger.info('Running input node with messages:', { messages });

    // Get the initial request (first message)
    const initialRequest = messages[0];
    logger.info('Initial request:', { initialRequest });
    // First, summarize the new message
    const latestMessage = messages[messages.length - 1];
    const summarizedMessage = await summarizeResults(latestMessage.content);
    
    // Extract status from the message content
    const status = summarizedMessage.summary?.toString().includes('STATUS: COMPLETED') 
      ? 'COMPLETED' 
      : summarizedMessage.summary?.toString().includes('STATUS: PENDING')
      ? 'PENDING'
      : 'UNKNOWN';

    // Store with status metadata
    const docs = [
      new Document({
        pageContent: JSON.stringify(summarizedMessage),
        metadata: {
          index: messages.length - 1,
          type: latestMessage._getType(),
          status: status,
          timestamp: Date.now(), // Add timestamp for recency
        },
      }),
    ];

    await inMemoryVectorStore.addDocuments(docs);

    // Search using the summarized content, with status-based reranking
    const relevantDocs = await inMemoryVectorStore.similaritySearch(
      JSON.stringify(latestMessage.content),
      5, // Increased to get more context
    );

    // Rerank results to prioritize completed tasks
    const rankedDocs = relevantDocs.sort((a, b) => {
      // First prioritize by status (COMPLETED > PENDING)
      if (a.metadata.status === 'COMPLETED' && b.metadata.status !== 'COMPLETED') return -1;
      if (b.metadata.status === 'COMPLETED' && a.metadata.status !== 'COMPLETED') return 1;
      
      // Then by recency
      return (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0);
    });

    // Take top 3 after reranking
    const relevantMessages = rankedDocs.slice(0, 3).map(doc => ({
      content: JSON.parse(doc.pageContent),
      type: doc.metadata.type,
      status: doc.metadata.status,
    }));

    logger.info('relevant messages:', {
      messages: relevantMessages.map(m => ({
        status: m.status,
        type: m.type,
        // Include truncated content preview for debugging
        contentPreview: JSON.stringify(m.content).slice(0, 100) + '...',
      }))
    });

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: [
        { content: initialRequest.content, type: 'initial_request' },
        ...relevantMessages.map(message => message.content)
      ],
    });

    logger.info('Formatted prompt:', { formattedPrompt });

    const result = await orchestratorModel.invoke(
      'Summarized of previous tool call: ' + formattedPrompt,
    );

    return {
      messages: [result],
    };
  };

  return runNode;
};
