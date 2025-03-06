import { ScheduledTask } from '../types/types';

/* eslint-disable no-undef */
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
/* eslint-enable no-undef */
const API_BASE_URL = `http://localhost:${API_PORT}/api`;

const DEFAULT_NAMESPACE = 'orchestrator';

export interface TaskEventMessage {
  type: string;
  timestamp: string;
  namespace: string;
  tasks?: {
    current?: any;
    scheduled: any[];
    completed: any[];
  };
  message?: string;
}

type TaskUpdateCallback = (tasks: ScheduledTask[]) => void;
type CurrentTaskUpdateCallback = (task: ScheduledTask | undefined) => void;
type ConnectionStatusCallback = (status: ConnectionStatus) => void;

export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

const taskCallbacks: TaskUpdateCallback[] = [];
const currentTaskCallbacks: CurrentTaskUpdateCallback[] = [];
const connectionStatusCallbacks: ConnectionStatusCallback[] = [];
let taskEventSource: EventSource | null = null;
let activeNamespace = DEFAULT_NAMESPACE;
let connectionStatus = ConnectionStatus.DISCONNECTED;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isInitialized = false;

// Max backoff delay is ~5 minutes (300000ms)
const MAX_RECONNECT_DELAY = 300000;

// Set connection status and notify listeners
const setConnectionStatus = (status: ConnectionStatus) => {
  connectionStatus = status;
  connectionStatusCallbacks.forEach(callback => callback(status));
};

// Exponential backoff for reconnection attempts
const getReconnectDelay = () => {
  // Start with 1 second, then exponential backoff with some randomness
  const delay = Math.min(
    1000 * Math.pow(1.5, reconnectAttempts) + Math.random() * 1000,
    MAX_RECONNECT_DELAY,
  );
  return delay;
};

export const connectToTaskStream = (namespace: string = DEFAULT_NAMESPACE): void => {
  console.log(`Attempting to connect to task stream for namespace: ${namespace}`);

  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Close existing connection if any
  if (taskEventSource) {
    taskEventSource.close();
    taskEventSource = null;
  }

  activeNamespace = namespace;
  setConnectionStatus(ConnectionStatus.CONNECTING);

  try {
    // Correct URL path to match the API routes structure
    const url = `${API_BASE_URL}/${namespace}/taskStream`;
    console.log(`Connecting to task stream at: ${url}`);

    taskEventSource = new EventSource(url);

    taskEventSource.onopen = () => {
      console.log(`Connected to task stream for namespace: ${namespace}`);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    };

    taskEventSource.onmessage = event => {
      try {
        console.log(`Received task stream message:`, event.data);
        const data = JSON.parse(event.data) as TaskEventMessage;

        if (data.type === 'tasks') {
          // Handle scheduled tasks
          if (data.tasks?.scheduled) {
            // Map API tasks to our app's task format
            const tasks = data.tasks.scheduled
              .map((task: any) => ({
                id: task.id,
                time: new Date(task.scheduledFor),
                description: task.message,
              }))
              .sort((a: ScheduledTask, b: ScheduledTask) => a.time.getTime() - b.time.getTime());

            console.log(`Mapped ${tasks.length} tasks`);

            // Notify all registered callbacks
            taskCallbacks.forEach(callback => callback(tasks));
          }
          
          // Handle current task
          if (data.tasks?.current) {
            const currentTask = data.tasks.current;
            const mappedTask: ScheduledTask = {
              id: currentTask.id,
              time: new Date(currentTask.scheduledFor),
              description: currentTask.message,
              startedAt: currentTask.startedAt ? new Date(currentTask.startedAt) : undefined,
              status: currentTask.status
            };
            
            console.log('Current task detected:', mappedTask);
            currentTaskCallbacks.forEach(callback => callback(mappedTask));
          } else if (data.tasks && !data.tasks.current) {
            console.log('No current task running');
            currentTaskCallbacks.forEach(callback => callback(undefined));
          }
        }
      } catch (error) {
        console.error('Error parsing task stream message:', error);
      }
    };

    taskEventSource.onerror = error => {
      console.error('Task stream error:', error);
      taskEventSource?.close();
      taskEventSource = null;
      setConnectionStatus(ConnectionStatus.ERROR);

      // Try to reconnect with exponential backoff
      reconnectAttempts++;
      const delay = getReconnectDelay();
      console.log(
        `Attempting to reconnect in ${Math.round(delay / 1000)} seconds (attempt ${reconnectAttempts})...`,
      );

      reconnectTimeout = setTimeout(() => {
        if (!taskEventSource) {
          connectToTaskStream(activeNamespace);
        }
      }, delay);
    };
  } catch (error) {
    console.error('Failed to connect to task stream:', error);
    setConnectionStatus(ConnectionStatus.ERROR);

    // Attempt to reconnect
    reconnectAttempts++;
    const delay = getReconnectDelay();
    reconnectTimeout = setTimeout(() => connectToTaskStream(activeNamespace), delay);
  }

  isInitialized = true;
};

export const subscribeToTaskUpdates = (callback: TaskUpdateCallback): (() => void) => {
  taskCallbacks.push(callback);

  if (!isInitialized || connectionStatus === ConnectionStatus.DISCONNECTED) {
    connectToTaskStream();
  }

  return () => {
    const index = taskCallbacks.indexOf(callback);
    if (index !== -1) {
      taskCallbacks.splice(index, 1);
    }
  };
};

export const subscribeToCurrentTask = (callback: CurrentTaskUpdateCallback): (() => void) => {
  currentTaskCallbacks.push(callback);
  
  // Initialize connection if not already done
  if (!isInitialized || connectionStatus === ConnectionStatus.DISCONNECTED) {
    connectToTaskStream();
  }
  
  return () => {
    const index = currentTaskCallbacks.indexOf(callback);
    if (index !== -1) {
      currentTaskCallbacks.splice(index, 1);
    }
  };
};

export const subscribeToConnectionStatus = (callback: ConnectionStatusCallback): (() => void) => {
  connectionStatusCallbacks.push(callback);

  callback(connectionStatus);

  return () => {
    const index = connectionStatusCallbacks.indexOf(callback);
    if (index !== -1) {
      connectionStatusCallbacks.splice(index, 1);
    }
  };
};

export const reconnect = (): void => {
  console.log('Manual reconnection triggered');
  connectToTaskStream(activeNamespace);
};

export const deleteTask = async (
  taskId: string,
  namespace = DEFAULT_NAMESPACE,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${namespace}/task/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};

export const closeTaskStream = (): void => {
  if (taskEventSource) {
    taskEventSource.close();
    taskEventSource = null;
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  setConnectionStatus(ConnectionStatus.DISCONNECTED);
  taskCallbacks.length = 0;
  currentTaskCallbacks.length = 0;
  connectionStatusCallbacks.length = 0;
  reconnectAttempts = 0;
};

// Monitor browser visibility to reconnect when user returns to the tab/page
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      isInitialized &&
      (connectionStatus === ConnectionStatus.DISCONNECTED ||
        connectionStatus === ConnectionStatus.ERROR)
    ) {
      console.log('Page is now visible, attempting to reconnect to task stream');
      reconnect();
    }
  });

  // Monitor browser online status to reconnect when internet connection is restored
  window.addEventListener('online', () => {
    if (
      isInitialized &&
      (connectionStatus === ConnectionStatus.DISCONNECTED ||
        connectionStatus === ConnectionStatus.ERROR)
    ) {
      console.log('Browser is back online, attempting to reconnect to task stream');
      reconnect();
    }
  });

  window.addEventListener('offline', () => {
    if (isInitialized && connectionStatus === ConnectionStatus.CONNECTED) {
      console.log('Browser went offline, task stream connection may be interrupted');
      setConnectionStatus(ConnectionStatus.ERROR);
    }
  });
}

connectToTaskStream();
