# Slack Tool

This is a simple slack integration to interact in slack channels.

## Environment Variables

```env
SLACK_APP_TOKEN="xoxb-"
```

## Setup

1. Create a Slack app in the [Slack API Console](https://api.slack.com/apps)
2. Enable the following permissions for your app:

   - `chat:write`
   - `chat:write.public`
   - `channels:read`
   - `channels:history`
   - `groups:read` (for private channels)
   - `im:read` (for direct messages)
   - `mpim:read` (for group direct messages)
   - `users:read` (for user information)
   - `reactions:read` (to read reactions to messages)
   - `reactions:write` (to react to messages)

3. Install the app to your workspace
4. Set the following environment variables:
   ```
   SLACK_APP_TOKEN=xoxb-your-bot-token
   ```

## Slack App manifest example

```yaml
display_information:
  name: Autonomys Agents Slack App
  description: Integrate Slack in our Autonomys Agent Framework
  background_color: '#000125'
  long_description: The Autonomys Agents Slack Tool enables seamless communication between your autonomous agents and Slack channels. It provides a simple yet powerful interface to post messages, updates, and notifications directly to specified Slack channels. This integration allows agents to keep teams informed about their activities, send alerts, and maintain communication logs in real-time, making it an essential component for monitoring and tracking agent operations through Slack's familiar interface.
features:
  bot_user:
    display_name: Autonomys Agents Slack App
    always_online: false
oauth_config:
  scopes:
    bot:
      - app_mentions:read
      - chat:write
      - chat:write.public
      - channels:history
      - channels:read
      - groups:read
      - im:read
      - mpim:read
      - users:read
      - reactions:read
      - reactions:write
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

## Slack API Documentation

For more information about the Slack API, visit the [Slack API Documentation](https://api.slack.com/).
