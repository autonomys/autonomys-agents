# Notion Tools

This module provides a set of tools for interacting with Notion through the official Notion API. It allows agents to create and manage pages, comments, and notifications in Notion.

## Features

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

## Available Tools

- create_notion_page
- update_notion_page
- add_notion_comment
- reply_to_notion_comment

## Usage Example

```typescript
import { createNotionTools } from './notion';

const notionToken = 'your-notion-integration-token';
const tools = await createNotionTools(notionToken);

// Use the tools in your agent
```

## Notes

- All tools include proper error handling and logging
- Responses are returned as JSON strings
- The tools use TypeScript for type safety
- The module follows the same pattern as other tool modules in the project
