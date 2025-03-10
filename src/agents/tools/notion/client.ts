import { Client } from '@notionhq/client';
import type {
  AppendBlockChildrenParameters,
  CreateDatabaseParameters,
  CreatePageParameters,
} from '@notionhq/client/build/src/api-endpoints.d.ts';
import { createLogger } from '../../../utils/logger.js';

export const logger = createLogger('notion-client');

export const notionClient = async (token: string) => {
  const client = new Client({ auth: token });

  // Verify the integration token by making a test request
  try {
    const me = await client.users.me({});
    logger.info('me', { me });
  } catch (error) {
    throw new Error('Failed to authenticate with Notion');
  }

  const listDatabases = async () => {
    const response = await client.search({
      filter: {
        property: 'object',
        value: 'database',
      },
    });
    logger.info('listDatabases', { results: response.results });
    return response;
  };

  const createDatabase = async (
    databaseId: string,
    title: string,
    properties: CreateDatabaseParameters['properties'],
  ) => {
    const response = await client.databases.create({
      parent: {
        database_id: databaseId,
        type: 'database_id',
      },
      title: [{ type: 'text', text: { content: title } }],
      properties,
    });
    logger.info('createDatabase', { response });
    return response;
  };

  const listDatabasePages = async (databaseId: string) => {
    const response = await client.databases.query({
      database_id: databaseId,
    });
    logger.info('listDatabasePages', { results: response.results });
    return response;
  };

  const createPage = async (
    parentId: string,
    title: string,
    children: CreatePageParameters['children'],
  ) => {
    const response = await client.pages.create({
      parent: { page_id: parentId },
      properties: {
        Name: {
          title: [{ text: { content: title } }],
        },
      },
      children,
    });
    logger.info('createPage', { response });
    return response;
  };

  const updatePage = async (
    pageId: string,
    children: AppendBlockChildrenParameters['children'],
  ) => {
    const response = await client.blocks.children.append({
      block_id: pageId,
      children,
    });
    logger.info('updatePage', { response });
    return response;
  };

  const addCommentToPage = async (pageId: string, content: string) => {
    const response = await client.comments.create({
      parent: { page_id: pageId, type: 'page_id' },
      rich_text: [{ text: { content } }],
    });
    logger.info('addComment', { response });
    return response;
  };

  const addCommentToDiscussion = async (discussionId: string, content: string) => {
    const response = await client.comments.create({
      discussion_id: discussionId,
      rich_text: [{ text: { content } }],
    });
    logger.info('addComment', { response });
    return response;
  };

  const replyToComment = async (commentId: string, content: string) => {
    const response = await client.comments.create({
      parent: { page_id: commentId },
      rich_text: [{ text: { content } }],
    });
    logger.info('replyToComment', { response });
    return response;
  };

  const getComments = async (pageId: string) => {
    const response = await client.comments.list({
      block_id: pageId,
    });
    logger.info('getComments', { response });
    return response;
  };

  return {
    client,
    listDatabases,
    createDatabase,
    listDatabasePages,
    createPage,
    updatePage,
    addCommentToPage,
    addCommentToDiscussion,
    replyToComment,
    getComments,
  };
};

export default notionClient;
