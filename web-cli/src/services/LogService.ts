import { EventSourceMessage } from '../types/types';

const API_BASE_URL = 'http://localhost:3001/api';

// State
const eventSources = new Map<string, EventSource>();
const messageCallbacks: Array<(message: EventSourceMessage) => void> = [];
let namespaces: string[] = [];

// Fetch available namespaces
export const fetchNamespaces = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/namespaces`);
    const data = await response.json();
    namespaces = data.namespaces || [];
    return namespaces;
  } catch (error) {
    console.error('Failed to fetch namespaces:', error);
    return [];
  }
};

// Get current namespaces
export const getNamespaces = (): string[] => {
  return namespaces;
};

// Subscribe to a namespace's logs
export const subscribeToNamespace = (namespace: string): void => {
  if (eventSources.has(namespace)) {
    return; // Already subscribed
  }

  const eventSource = new EventSource(`${API_BASE_URL}/${namespace}/logs`);

  eventSource.onmessage = (event) => {
    try {
      const eventData = JSON.parse(event.data);
      const message: EventSourceMessage = {
        namespace,
        ...eventData
      };
      
      messageCallbacks.forEach(callback => callback(message));
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error(`EventSource error for namespace ${namespace}:`, error);
    closeNamespace(namespace);
    setTimeout(() => subscribeToNamespace(namespace), 5000); // Reconnect after 5 seconds
  };

  eventSources.set(namespace, eventSource);
};

// Close a namespace's connection
export const closeNamespace = (namespace: string): void => {
  const eventSource = eventSources.get(namespace);
  if (eventSource) {
    eventSource.close();
    eventSources.delete(namespace);
  }
};

// Subscribe to all log messages
export const subscribeToMessages = (callback: (message: EventSourceMessage) => void): (() => void) => {
  messageCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = messageCallbacks.indexOf(callback);
    if (index !== -1) {
      messageCallbacks.splice(index, 1);
    }
  };
};

// Close all connections
export const closeAll = (): void => {
  eventSources.forEach((eventSource) => {
    eventSource.close();
  });
  eventSources.clear();
  messageCallbacks.length = 0;
};

// Initialize by fetching namespaces
fetchNamespaces(); 