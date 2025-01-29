import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { summarizeResults } from '../../../tools/summarizerTool.js';
import { config as appConfig } from '../../../../config/index.js';

const logger = createLogger('orchestrator-input-node');

const RELEVANT_MESSAGES_COUNT = 3;

// Helper functions
const determineStatus = (summary: string | undefined): 'COMPLETED' | 'PENDING' | 'UNKNOWN' => {
  if (!summary) return 'UNKNOWN';
  if (summary.includes('STATUS: COMPLETED')) return 'COMPLETED';
  if (summary.includes('STATUS: PENDING')) return 'PENDING';
  return 'UNKNOWN';
};

const createDocumentFromMessage = (message: any, index: number, status: string) => {
  return new Document({
    pageContent: JSON.stringify(message),
    metadata: {
      index,
      type: typeof message.type === 'string' ? message.type : 'unknown',
      status,
      timestamp: Date.now(),
    },
  });
};

const rankDocumentsByRelevance = (docs: Document[]) => {
  return docs.sort((a, b) => {
    if (a.metadata.status === 'COMPLETED' && b.metadata.status !== 'COMPLETED') return -1;
    if (b.metadata.status === 'COMPLETED' && a.metadata.status !== 'COMPLETED') return 1;
    return (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0);
  });
};

const formatRelevantMessages = (docs: Document[]) => {
  return docs.slice(0, RELEVANT_MESSAGES_COUNT).map(doc => ({
    content: JSON.parse(doc.pageContent),
    type: doc.metadata.type,
    status: doc.metadata.status,
  }));
};

export const createInputNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: appConfig.llmConfig.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });
  const inMemoryVectorStore = new MemoryVectorStore(embeddings);

  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    logger.info('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const initialRequest = messages[0];
    const latestMessage = messages[messages.length - 1];
    const summarizedMessage = await summarizeResults(latestMessage.content);
    const status = determineStatus(summarizedMessage.summary?.toString());

    const docs = [createDocumentFromMessage(summarizedMessage, messages.length - 1, status)];
    await inMemoryVectorStore.addDocuments(docs);

    const relevantDocs = await inMemoryVectorStore.similaritySearch(
      JSON.stringify(latestMessage.content),
      5,
    );

    const rankedDocs = rankDocumentsByRelevance(relevantDocs);
    const relevantMessages = formatRelevantMessages(rankedDocs);

    logger.info('relevant messages:', {
      messages: relevantMessages.map(m => ({
        status: m.status,
        type: m.type,
        contentPreview: `${JSON.stringify(m.content).slice(0, 100)}...`,
      })),
    });

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: [
        { content: initialRequest.content, type: 'initial_request' },
        ...relevantMessages.map(message => message.content),
      ],
    });

    logger.info('Formatted prompt:', { formattedPrompt });

    const result = await orchestratorModel.invoke(
      `Summarized of previous tool call: ${formattedPrompt}`,
    );

    return { messages: [result] };
  };

  return runNode;
};
