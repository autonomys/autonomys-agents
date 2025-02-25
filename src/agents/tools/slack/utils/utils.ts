import { createLogger } from '../../../../utils/logger.js';

interface SlackBlock {
  type: string;
  text: {
    type: string;
    text: string;
  };
}

interface SlackPayload {
  channel: string;
  text: string;
  blocks: SlackBlock[];
  ts?: string;
}

const logger = createLogger('slack-tool');

export const sendSlackMessage = async (
  message: string,
  blocks: SlackBlock[],
  messageIdToEdit?: string,
  token?: string,
  conversationId?: string,
): Promise<string | undefined> => {
  token = token || process.env.SLACK_APP_TOKEN;
  conversationId = conversationId || process.env.SLACK_CONVERSATION_ID || '';
  if (!token) {
    logger.error('Slack token is not set');
    return undefined;
  }
  if (!conversationId) {
    logger.error('Slack conversation ID is not set');
    return undefined;
  }
  const url = messageIdToEdit
    ? 'https://slack.com/api/chat.update'
    : 'https://slack.com/api/chat.postMessage';

  const payload: SlackPayload = {
    channel: conversationId,
    text: message,
    blocks: blocks,
  };

  if (messageIdToEdit) {
    payload.ts = messageIdToEdit;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error);

    return data.ts || undefined;
  } catch (e) {
    console.error('Error sending slack message', e);
  }
};

export const postSlackMsg = async (message: string) => {
  logger.info('Posting message to Slack - Starting');

  try {
    const slackMessage = await sendSlackMessage(message, [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: message,
        },
      },
    ]);
    logger.info('Posting message to Slack', { slackMessage });

    return {
      success: true,
      ts: slackMessage,
    };
  } catch (error) {
    logger.error('Error posting message to Slack:', error);
    throw error;
  }
};
