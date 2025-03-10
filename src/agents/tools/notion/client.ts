import { Client } from '@notionhq/client';
import type {
  CommentObjectResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints.d.ts';

export type PageInfo = {
  id: string;
  title: string;
  url: string;
  lastEdited: Date;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace' | 'block_id';
    id: string;
  };
};

export type CommentInfo = {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  parent: {
    type: 'page_id' | 'block_id';
    id: string;
  };
};

const toPageInfo = (page: PageObjectResponse): PageInfo => {
  const title =
    page.properties.Name?.type === 'title' ? (page.properties.Name.title[0]?.plain_text ?? '') : '';

  return {
    id: page.id,
    title,
    url: page.url,
    lastEdited: new Date(page.last_edited_time),
    parent: {
      type: page.parent.type,
      id:
        page.parent.type === 'database_id'
          ? page.parent.database_id
          : page.parent.type === 'page_id'
            ? page.parent.page_id
            : 'workspace',
    },
  };
};

const toCommentInfo = (comment: CommentObjectResponse): CommentInfo => {
  return {
    id: comment.id,
    content: comment.rich_text[0]?.plain_text ?? '',
    createdBy: comment.created_by.id,
    createdAt: new Date(comment.created_time),
    parent: {
      type: comment.parent.type,
      id: comment.parent.type === 'page_id' ? comment.parent.page_id : comment.parent.block_id,
    },
  };
};

export const notionClient = async (token: string) => {
  const client = new Client({ auth: token });

  // Verify the integration token by making a test request
  try {
    await client.users.me({});
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
    return response.results.map(page => toPageInfo(page as PageObjectResponse));
  };

  const listDatabasePages = async (databaseId: string) => {
    const response = await client.databases.query({
      database_id: databaseId,
    });
    return response.results.map(page => toPageInfo(page as PageObjectResponse));
  };

  const createPage = async (parentId: string, title: string, content: any) => {
    const response = await client.pages.create({
      parent: { page_id: parentId },
      properties: {
        Name: {
          title: [{ text: { content: title } }],
        },
      },
      children: content,
    });
    return toPageInfo(response as PageObjectResponse);
  };

  const updatePage = async (pageId: string, content: any) => {
    const response = await client.blocks.children.append({
      block_id: pageId,
      children: content,
    });
    return response;
  };

  const addComment = async (pageId: string, content: string) => {
    const response = await client.comments.create({
      parent: { page_id: pageId },
      rich_text: [{ text: { content } }],
    });
    return toCommentInfo(response as CommentObjectResponse);
  };

  const replyToComment = async (commentId: string, content: string) => {
    const response = await client.comments.create({
      parent: { page_id: commentId },
      rich_text: [{ text: { content } }],
    });
    return toCommentInfo(response as CommentObjectResponse);
  };

  const getComments = async (pageId: string) => {
    const response = await client.comments.list({
      block_id: pageId,
    });
    return response.results.map(comment => toCommentInfo(comment as CommentObjectResponse));
  };

  return {
    client,
    listDatabases,
    listDatabasePages,
    createPage,
    updatePage,
    addComment,
    replyToComment,
    getComments,
  };
};

export default notionClient;
