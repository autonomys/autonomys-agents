# Slack Tool

This is a simple slack integration to post message to a specific channel.

For this tool to work, you need to specify two environment variables

## Environment Variables

```env
SLACK_APP_TOKEN="xoxb-"
SLACK_CONVERSATION_ID=""
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
      - im:read
      - channels:history
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

## Slack API Documentation

[Slack API](https://api.slack.com/)
