import { DynamicStructuredTool } from '@langchain/core/tools';
import { CreateDatabaseResponse } from '@notionhq/client/build/src/api-endpoints.js';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { CommentInfo, notionClient, PageInfo } from './client.js';

const logger = createLogger('notion-tools');

/**
 * Creates a tool to list pages in Notion
 */
export const createListDatabasesTool = (listDatabases: () => Promise<PageInfo[]>) =>
  new DynamicStructuredTool({
    name: 'list_notion_databases',
    description: `List all databases in Notion that the integration has access to.
    USE THIS WHEN: 
    - You need to find existing databases
    - You want to see what databases are available to work with
    - You need to get database IDs for other operations`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing Notion databases');
        const databases = await listDatabases();
        logger.info('Databases retrieved from Notion:', { count: databases.length });
        return JSON.stringify({
          success: true,
          databases,
        });
      } catch (error) {
        logger.error('Error listing Notion databases:', error);
        return JSON.stringify({
          success: false,
          error: error,
        });
      }
    },
  });
/**
 * Creates a tool to create a new database in Notion
 */
export const createCreateDatabaseTool = (
  createDatabase: (title: string) => Promise<CreateDatabaseResponse>,
) =>
  new DynamicStructuredTool({
    name: 'create_notion_database',
    description: `Create a new database in Notion.
      USE THIS WHEN: 
      - You need to create a new database at the workspace level
      - You want to set up a structured data collection`,
    schema: z.object({
      title: z.string().describe('The title of the new database.'),
    }),
    func: async ({ title }) => {
      try {
        logger.info('Creating Notion database - Received data:', { title });
        const result = await createDatabase(title);
        logger.info('Database created in Notion:', { result });
        return JSON.stringify({
          success: true,
          database: result,
        });
      } catch (error) {
        logger.error('Error creating Notion database:', error);
        return JSON.stringify({
          success: false,
          error: error,
        });
      }
    },
  });

/**
 * Creates a tool to list pages in a specific database
 */
export const createListDatabasePagesTool = (
  listDatabasePages: (databaseId: string) => Promise<PageInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'list_notion_database_pages',
    description: `List all pages in a specific Notion database.
      USE THIS WHEN: 
      - You need to find pages within a specific database
      - You want to see what content exists in a particular database
      - You need to get page IDs from a specific database`,
    schema: z.object({
      databaseId: z.string().describe('The ID of the database to list pages from.'),
    }),
    func: async ({ databaseId }) => {
      try {
        logger.info('Listing Notion database pages - Received data:', { databaseId });
        const pages = await listDatabasePages(databaseId);
        logger.info('Pages retrieved from Notion database:', { count: pages.length });
        return JSON.stringify({
          success: true,
          pages,
        });
      } catch (error) {
        logger.error('Error listing Notion database pages:', error);
        return JSON.stringify({
          success: false,
          error: error,
        });
      }
    },
  });

/**
 * Creates a tool to create a new page in Notion
 */
export const createCreatePageTool = (
  createPage: (parentId: string, title: string, content: any) => Promise<PageInfo>,
) =>
  new DynamicStructuredTool({
    name: 'create_notion_page',
    description: `Create a new page in Notion.
    USE THIS WHEN: 
    - You need to create a new page in Notion
    - You want to document something in a structured way`,
    schema: z.object({
      parentId: z
        .string()
        .describe('The ID of the parent page or database where the new page will be created.'),
      title: z.string().describe('The title of the new page.'),
      content: z.array(z.any()).describe('The content blocks to add to the page.'),
    }),
    func: async ({ parentId, title, content }) => {
      try {
        logger.info('Creating Notion page - Received data:', { parentId, title });
        const result = await createPage(parentId, title, content);
        logger.info('Page created in Notion:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error creating Notion page:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to update page content in Notion
 */
export const createUpdatePageTool = (updatePage: (pageId: string, content: any) => Promise<any>) =>
  new DynamicStructuredTool({
    name: 'update_notion_page',
    description: `Update content of an existing page in Notion.
    USE THIS WHEN: 
    - You need to add or modify content in an existing page
    - You want to append new blocks to a page`,
    schema: z.object({
      pageId: z.string().describe('The ID of the page to update.'),
      content: z.array(z.any()).describe('The content blocks to add to the page.'),
    }),
    func: async ({ pageId, content }) => {
      try {
        logger.info('Updating Notion page - Received data:', { pageId });
        const result = await updatePage(pageId, content);
        logger.info('Page updated in Notion:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error updating Notion page:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to add a comment to a page
 */
export const createAddCommentTool = (
  addComment: (pageId: string, content: string) => Promise<CommentInfo>,
) =>
  new DynamicStructuredTool({
    name: 'add_notion_comment',
    description: `Add a comment to a page in Notion.
    USE THIS WHEN: 
    - You want to add a comment to a page
    - You need to provide feedback or notes on content`,
    schema: z.object({
      pageId: z.string().describe('The ID of the page to comment on.'),
      content: z.string().describe('The content of the comment.'),
    }),
    func: async ({ pageId, content }) => {
      try {
        logger.info('Adding Notion comment - Received data:', { pageId, content });
        const result = await addComment(pageId, content);
        logger.info('Comment added to Notion:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error adding Notion comment:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to reply to a comment
 */
export const createReplyToCommentTool = (
  replyToComment: (commentId: string, content: string) => Promise<CommentInfo>,
) =>
  new DynamicStructuredTool({
    name: 'reply_to_notion_comment',
    description: `Reply to an existing comment in Notion.
    USE THIS WHEN: 
    - You want to respond to a specific comment
    - You need to continue a discussion thread`,
    schema: z.object({
      commentId: z.string().describe('The ID of the comment to reply to.'),
      content: z.string().describe('The content of the reply.'),
    }),
    func: async ({ commentId, content }) => {
      try {
        logger.info('Replying to Notion comment - Received data:', { commentId, content });
        const result = await replyToComment(commentId, content);
        logger.info('Reply added to Notion:', { result });
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error replying to Notion comment:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get comments on a page
 */
export const createGetCommentsTool = (getComments: (pageId: string) => Promise<CommentInfo[]>) =>
  new DynamicStructuredTool({
    name: 'get_notion_comments',
    description: `Get all comments on a page in Notion.
    USE THIS WHEN: 
    - You want to see all comments on a page
    - You need to review feedback or discussions`,
    schema: z.object({
      pageId: z.string().describe('The ID of the page to get comments from.'),
    }),
    func: async ({ pageId }) => {
      try {
        logger.info('Getting Notion comments - Received data:', { pageId });
        const comments = await getComments(pageId);
        return JSON.stringify({
          success: true,
          comments,
        });
      } catch (error) {
        logger.error('Error getting Notion comments:', error);
        return JSON.stringify({
          success: false,
          error: error,
        });
      }
    },
  });

export const createNotionTools = async (notionToken: string) => {
  const notion = await notionClient(notionToken);

  const listDatabases = () => notion.listDatabases();
  const createDatabase = (title: string) => notion.createDatabase(title);
  const listDatabasePages = (databaseId: string) => notion.listDatabasePages(databaseId);
  const createPage = (parentId: string, title: string, content: any) =>
    notion.createPage(parentId, title, content);
  const updatePage = (pageId: string, content: any) => notion.updatePage(pageId, content);
  const addComment = (pageId: string, content: string) => notion.addComment(pageId, content);
  const replyToComment = (commentId: string, content: string) =>
    notion.replyToComment(commentId, content);
  const getComments = (pageId: string) => notion.getComments(pageId);

  return [
    createListDatabasesTool(listDatabases),
    createCreateDatabaseTool(createDatabase),
    createListDatabasePagesTool(listDatabasePages),
    createCreatePageTool(createPage),
    createUpdatePageTool(updatePage),
    createAddCommentTool(addComment),
    createReplyToCommentTool(replyToComment),
    createGetCommentsTool(getComments),
  ];
};
