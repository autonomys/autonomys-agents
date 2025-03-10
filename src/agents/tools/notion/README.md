# Notion Tools

This module provides a set of tools for interacting with Notion through the official Notion API. It allows agents to create and manage pages, comments, and notifications in Notion.

## Features

- List all accessible Notion databases
- Create a database in Notion
- List pages within a specific database
- Create new pages in Notion
- Update existing page content
- Add comments to pages
- Reply to existing comments
- Get comments on a page

## Setup

To use these tools, you need to:

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Get your integration token
3. Share the pages/databases you want to access with your integration
4. Pass the integration token when creating the tools
5. Create a entrypoint page (database) and retrieve the database ID from the url (the UUID that follow the shortname of the page)
6. Go to ... in top right of the page (page settings)
7. Go to Connections in page settings
8. Search for your integration app and approve the integration

The agent will use the entrypoint page as the default database, if it create more page, it may go deeper in these page and create other children pages. In Notion pretty much every database/page exist as a children of an other database/page.

## Environment Variables

Add in your character .env

`NOTION_TOKEN` The integration token
`NOTION_DATABASE_ID` The default page/db id to use

## Available Tools

- list_notion_databases - List all databases accessible to the integration
- create_notion_database - Create a database in Notion
- list_notion_database_pages - List all pages within a specific database
- create_notion_page - Create a new page in Notion
- update_notion_page - Update content of an existing page
- add_notion_comment - Add a comment to a page
- reply_to_notion_comment - Reply to an existing comment
- get_notion_comments - Get all comments on a page

## Usage Example

```typescript
import { createNotionTools } from './notion';

const notionToken = 'your-notion-integration-token';
const notionDatabaseId = 'your-notion-default-db-id';
const tools = await createNotionTools(notionToken, notionDatabaseId);

// Use the tools in your agent
```

## Notes

- All tools include proper error handling and logging
- Responses are returned as JSON strings
- The tools use TypeScript for type safety
- The module follows the same pattern as other tool modules in the project
