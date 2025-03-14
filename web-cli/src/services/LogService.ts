import { EventSourceMessage } from '../types/types';
import { API_BASE_URL, API_TOKEN, apiRequest } from './Api';

const eventSources = new Map<string, any>();
const messageCallbacks: Array<(message: EventSourceMessage) => void> = [];
let namespaces: string[] = [];

export const fetchNamespaces = async (): Promise<string[]> => {
  try {
    const data = await apiRequest<{ namespaces: string[] }>('/namespaces');
    namespaces = data.namespaces || [];
    return namespaces;
  } catch (error) {
    console.error('Failed to fetch namespaces:', error);
    return [];
  }
};

export const getNamespaces = (): string[] => {
  return namespaces;
};

export const subscribeToNamespace = (namespace: string): void => {
  if (eventSources.has(namespace)) {
    return;
  }

  const tokenParam = API_TOKEN ? `?token=${encodeURIComponent(API_TOKEN)}` : '';
  const eventSource = new window.EventSource(`${API_BASE_URL}/${namespace}/logs${tokenParam}`);

  eventSource.onmessage = event => {
    try {
      const eventData = JSON.parse(event.data);
      const message: EventSourceMessage = {
        namespace,
        ...eventData,
      };

      messageCallbacks.forEach(callback => callback(message));
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = error => {
    console.error(`EventSource error for namespace ${namespace}:`, error);
    closeNamespace(namespace);
    setTimeout(() => subscribeToNamespace(namespace), 5000);
  };

  eventSources.set(namespace, eventSource);
};

export const closeNamespace = (namespace: string): void => {
  const eventSource = eventSources.get(namespace);
  if (eventSource) {
    eventSource.close();
    eventSources.delete(namespace);
  }
};

export const subscribeToMessages = (
  callback: (message: EventSourceMessage) => void,
): (() => void) => {
  messageCallbacks.push(callback);

  return () => {
    const index = messageCallbacks.indexOf(callback);
    if (index !== -1) {
      messageCallbacks.splice(index, 1);
    }
  };
};

export const closeAll = (): void => {
  eventSources.forEach(eventSource => {
    eventSource.close();
  });
  eventSources.clear();
  messageCallbacks.length = 0;
};

const _fetchnamespaces = fetchNamespaces();
