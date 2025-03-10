import { gmail, gmail_v1 } from '@googleapis/gmail';
import { JWT } from 'google-auth-library';

type GmailThread = gmail_v1.Schema$Thread;

const gmailClient = async (credentials: {
  email: string;
  password: string;
  appPassword: string;
}) => {
  const auth = new JWT({
    email: credentials.email,
    key: credentials.password || credentials.appPassword,
    scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  });

  const gmailClient = gmail({ version: 'v1', auth });

  const getRecentEmails = async (maxResults: number = 10): Promise<GmailThread[]> => {
    const response = await gmailClient.users.threads.list({
      userId: 'me',
      maxResults,
    });

    const threads = await Promise.all(
      (response.data.threads || []).map(async (thread: gmail_v1.Schema$Thread) => {
        const threadData = await gmailClient.users.threads.get({
          userId: 'me',
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: thread.id!,
        });
        return threadData;
      }),
    );

    return threads.map(thread => thread.data);
  };

  const sendEmail = async (params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }): Promise<{ success: boolean; messageId: string }> => {
    const { to, subject, body, threadId } = params;

    // Create email in base64 format
    const emailLines = [
      `To: ${to}`,
      `From: ${credentials.email}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ];

    if (threadId) {
      emailLines.push(`References: ${threadId}`);
      emailLines.push(`In-Reply-To: ${threadId}`);
    }

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const message = {
      raw: encodedEmail,
      threadId: threadId,
    };

    const response = await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: message,
    });

    return {
      success: true,
      messageId: response.data.id || '',
    };
  };

  const moveEmail = async (messageId: string, labelId: string): Promise<{ success: boolean }> => {
    await gmailClient.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
        removeLabelIds: ['INBOX'],
      },
    });

    return { success: true };
  };

  const deleteEmail = async (messageId: string): Promise<{ success: boolean }> => {
    await gmailClient.users.messages.trash({
      userId: 'me',
      id: messageId,
    });

    return { success: true };
  };

  return {
    getRecentEmails,
    sendEmail,
    moveEmail,
    deleteEmail,
  };
};

export default gmailClient;
