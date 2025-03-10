import { API_BASE_URL } from './Api';
export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}
export interface ChatEvent {
  type: 'message' | 'connection';
  namespace: string;
  message?: {
    role: 'user' | 'agent';
    content: string;
    timestamp: string;
  };
}

type ChatMessageCallback = (message: ChatMessage) => void;
const chatStreamSubscribers = new Map<string, Set<ChatMessageCallback>>();

const chatStreams = new Map<string, EventSource>();

export const subscribeToChatMessages = (
  namespace: string,
  callback: ChatMessageCallback,
): (() => void) => {
  if (!chatStreamSubscribers.has(namespace)) {
    chatStreamSubscribers.set(namespace, new Set());
    connectToChatStream(namespace);
  }

  const subscribers = chatStreamSubscribers.get(namespace)!;
  subscribers.add(callback);

  return () => {
    const subscribers = chatStreamSubscribers.get(namespace);
    if (subscribers) {
      subscribers.delete(callback);

      if (subscribers.size === 0) {
        chatStreamSubscribers.delete(namespace);
        closeChatStream(namespace);
      }
    }
  };
};

export const connectToChatStream = (namespace: string): void => {
  if (chatStreams.has(namespace)) {
    return;
  }

  const url = `${API_BASE_URL}/namespaces/${namespace}/chat/stream`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = event => {
    try {
      const data = JSON.parse(event.data) as ChatEvent;

      if (data.type === 'message' && data.message) {
        const message: ChatMessage = {
          id: Date.now().toString(),
          sender: data.message.role,
          content: data.message.content,
          timestamp: new Date(data.message.timestamp),
        };

        const subscribers = chatStreamSubscribers.get(namespace);
        if (subscribers) {
          subscribers.forEach(callback => callback(message));
        }
      }
    } catch (error) {
      console.error('Error parsing chat event:', error);
    }
  };

  eventSource.onerror = error => {
    console.error(`Chat stream error for namespace ${namespace}:`, error);
    setTimeout(() => {
      closeChatStream(namespace);
      connectToChatStream(namespace);
    }, 5000);
  };

  chatStreams.set(namespace, eventSource);
};

export const closeChatStream = (namespace: string): void => {
  const eventSource = chatStreams.get(namespace);
  if (eventSource) {
    eventSource.close();
    chatStreams.delete(namespace);
  }
};

export const sendChatMessage = async (
  namespace: string,
  content: string,
): Promise<{ streaming: boolean }> => {
  const url = `${API_BASE_URL}/namespaces/${namespace}/chat`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      return { streaming: true };
    }

    return { streaming: false };
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};
