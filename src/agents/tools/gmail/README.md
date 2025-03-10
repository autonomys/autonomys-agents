# Gmail Tools

This module provides a set of tools for interacting with Gmail through the Google API. It allows AI agents to read, send, organize, and delete emails.

## Prerequisites

1. Install the required dependencies:

```bash
npm install @googleapis/gmail
```

2. Set up Gmail Account:
   - Enable 2-Step Verification in your Google Account settings
   - Generate an App Password:
     1. Go to your Google Account settings
     2. Navigate to Security
     3. Under "2-Step Verification", click on "App passwords"
     4. Select "Mail" and your device
     5. Copy the generated 16-character password

## Configuration

You'll need the following credentials to use the Gmail tools:

```typescript
interface GmailCredentials {
  email: string; // Your Gmail address
  appPassword: string; // The 16-character app password generated from Google Account
}
```

## Usage

```typescript
import { createGmailTools } from './agents/tools/gmail';

const credentials = {
  email: 'your.email@gmail.com',
  appPassword: 'your-16-char-app-password',
};

const gmailTools = await createGmailTools(credentials);
```

## Available Tools

### 1. Read Gmail (`read_gmail`)

Retrieves recent email threads from your Gmail inbox.

```typescript
{
  name: 'read_gmail',
  parameters: {
    maxResults: number // Maximum number of threads to return (default: 10)
  }
}
```

### 2. Send Gmail (`send_gmail`)

Sends a new email or replies to an existing thread.

```typescript
{
  name: 'send_gmail',
  parameters: {
    to: string,      // Recipient email address
    subject: string, // Email subject
    body: string,    // Email content
    threadId?: string // Optional thread ID for replies
  }
}
```

### 3. Move Gmail (`move_gmail`)

Moves an email to a different label and/or removes it from the inbox.

```typescript
{
  name: 'move_gmail',
  parameters: {
    messageId: string, // ID of the email to move
    labelId: string   // ID of the destination label
  }
}
```

### 4. Delete Gmail (`delete_gmail`)

Moves an email to the trash.

```typescript
{
  name: 'delete_gmail',
  parameters: {
    messageId: string // ID of the email to delete
  }
}
```

## Error Handling

All tools include error handling and logging. Errors are logged using the application's logger and thrown to be handled by the calling code.

## Security Considerations

1. Never commit credentials to version control
2. Store credentials securely (e.g., environment variables, secret management service)
3. Use App Passwords instead of your main account password
4. Keep your App Password secure and revoke it if compromised
5. Consider implementing rate limiting to avoid hitting Gmail's limits

## Example

```typescript
// Initialize tools
const gmailTools = await createGmailTools({
  email: process.env.GMAIL_EMAIL!,
  appPassword: process.env.GMAIL_APP_PASSWORD!,
});

// Read recent emails
const readTool = gmailTools[0];
const emails = await readTool.func({ maxResults: 5 });

// Send an email
const sendTool = gmailTools[1];
await sendTool.func({
  to: 'recipient@example.com',
  subject: 'Hello from Gmail Tools',
  body: 'This is a test email sent using Gmail Tools.',
});
```

## Limitations

1. Currently only supports plain text emails
2. Attachments are not supported
3. HTML formatting is not supported
4. Label creation/deletion is not implemented
5. Only supports basic email operations (read, send, move, delete)

## Future Improvements

- Add support for HTML emails
- Implement attachment handling
- Add label management functionality
- Add support for draft emails
- Implement email search functionality
- Add support for email filters and rules
