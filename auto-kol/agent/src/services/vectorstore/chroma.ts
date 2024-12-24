import { ChromaClient } from 'chromadb';
import { Document } from 'langchain/document';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createLogger } from '../../utils/logger.js';
import { Tweet } from '../../types/twitter.js';
import { config } from '../../config/index.js';
import { isTweetExists } from '../../services/database/index.js';

const logger = createLogger('chroma-service');

export class ChromaService {
  private static instance: ChromaService;
  private client: ChromaClient;
  private embeddings: OpenAIEmbeddings;
  private collection!: Chroma;

  private constructor() {
    this.client = new ChromaClient({
      path: config.CHROMA_URL,
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });
    this.initializeCollection();
  }

  private async initializeCollection() {
    try {
      this.collection = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: 'tweets',
        url: config.CHROMA_URL,
        collectionMetadata: {
          'hnsw:space': 'cosine',
        },
      });
      logger.info('Chroma collection initialized');
    } catch (error) {
      logger.info('Collection does not exist, creating new one');
      this.collection = await Chroma.fromTexts(
        [], // No initial texts
        [], // No initial metadatas
        this.embeddings,
        {
          collectionName: 'tweets',
          url: config.CHROMA_URL,
          collectionMetadata: {
            'hnsw:space': 'cosine',
          },
        },
      );
    }
  }

  public static async getInstance(): Promise<ChromaService> {
    if (!ChromaService.instance) {
      ChromaService.instance = new ChromaService();
      await ChromaService.instance.initializeCollection();
    }
    return ChromaService.instance;
  }

  public async addTweet(tweet: Tweet) {
    try {
      if (await isTweetExists(tweet.id)) {
        logger.info(`Tweet ${tweet.id} already exists in vector store, skipping`);
        return;
      }

      const doc = new Document({
        pageContent: tweet.text,
        metadata: {
          tweetId: tweet.id,
          author_id: tweet.author_id,
          author_username: tweet.author_username,
          created_at: tweet.created_at,
        },
      });

      await this.collection.addDocuments([doc]);
      logger.info(`Added tweet ${tweet.id} to vector store`);
    } catch (error) {
      logger.error(`Failed to add tweet ${tweet.id} to vector store:`, error);
      throw error;
    }
  }

  public async searchSimilarTweets(query: string, k: number = 5) {
    try {
      const results = await this.collection.similaritySearch(query, k);
      return results;
    } catch (error) {
      logger.error('Failed to search similar tweets:', error);
      throw error;
    }
  }

  public async searchSimilarTweetsWithScore(query: string, k: number = 5) {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);
      const results = await this.collection.similaritySearchVectorWithScore(queryEmbedding, k);
      return results;
    } catch (error) {
      logger.error('Failed to search similar tweets with scores:', error);
      throw error;
    }
  }

  public async deleteTweet(tweetId: string) {
    try {
      await this.collection.delete({
        filter: {
          tweetId: tweetId,
        },
      });
      logger.info(`Deleted tweet ${tweetId} from vector store`);
    } catch (error) {
      logger.error(`Failed to delete tweet ${tweetId} from vector store:`, error);
      throw error;
    }
  }
}
