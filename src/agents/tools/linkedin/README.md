# LinkedIn Tools

This module provides a set of tools for interacting with LinkedIn's API, specifically designed for AI agent development and professional networking.

## Environment Setup

Add the following to your `.env` file:

```env
LINKEDIN_ACCESS_TOKEN=your_access_token_here
```

To obtain a LinkedIn Access Token:

1. Create a LinkedIn Developer Account at https://developer.linkedin.com/
2. Create a new application in the LinkedIn Developer Console
3. Request the following OAuth 2.0 scopes:
   - `r_liteprofile` - Read current user's profile
   - `r_emailaddress` - Read email address
   - `w_member_social` - Create and share posts
   - `r_network` - Read network connections
   - `w_member_social` - Manage network connections

## Available Tools

1. `share_linkedin_post` - Share posts and articles
2. `search_linkedin_connections` - Search for potential connections
3. `send_linkedin_connection_request` - Send connection requests
4. `get_recent_linkedin_posts` - Get recent posts from feed
5. `add_linkedin_reaction` - React to posts
6. `get_linkedin_reactions` - Get reactions on a post

## Usage Example

```typescript
import { createLinkedInTools } from './agents/tools/linkedin';

const linkedInTools = await createLinkedInTools(process.env.LINKEDIN_ACCESS_TOKEN);

// Tools will be available in your agent's toolkit
const agent = new Agent({
  tools: linkedInTools,
  // ... other configuration
});
```

## Error Handling

All tools include proper error handling and logging. Errors are logged using the built-in logger and will include relevant details for debugging.

## Rate Limiting

Be mindful of LinkedIn's API rate limits. The tools don't currently implement rate limiting, so you may need to add your own rate limiting logic depending on your usage patterns.

## Dependencies

- axios: For making HTTP requests to LinkedIn's API
- @langchain/core/tools: For tool definitions
- zod: For schema validation
