import { Task } from '../types/types';
import { API_BASE_URL, API_TOKEN, DEFAULT_NAMESPACE, apiRequest } from './Api';
import { TaskEventMessage } from '../types/types';

type TaskUpdateCallback = (tasks: Task[]) => void;
type CurrentTaskUpdateCallback = (task: Task | undefined) => void;
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

const setConnectionStatus = (status: ConnectionStatus) => {
  connectionStatus = status;
  connectionStatusCallbacks.forEach(callback => callback(status));
};

const getReconnectDelay = () => {
  const delay = Math.min(
    1000 * Math.pow(1.5, reconnectAttempts) + Math.random() * 1000,
    MAX_RECONNECT_DELAY,
  );
  return delay;
};

export const connectToTaskStream = (namespace: string = DEFAULT_NAMESPACE): void => {
  console.log(`Attempting to connect to task stream for namespace: ${namespace}`);

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (taskEventSource) {
    taskEventSource.close();
    taskEventSource = null;
  }

  activeNamespace = namespace;
  setConnectionStatus(ConnectionStatus.CONNECTING);

  try {
    const tokenParam = API_TOKEN ? `?token=${encodeURIComponent(API_TOKEN)}` : '';
    const url = `${API_BASE_URL}/${namespace}/taskStream${tokenParam}`;
    console.log(`Connecting to task stream at: ${url}`);

    taskEventSource = new EventSource(url);

    taskEventSource.onopen = () => {
      console.log(`Connected to task stream for namespace: ${namespace}`);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      reconnectAttempts = 0;
    };

    taskEventSource.onmessage = event => {
      try {
        console.log(`Received task stream message:`, event.data);
        const data = JSON.parse(event.data) as TaskEventMessage;

        if (data.type === 'tasks') {
          // Collect all task types that need to be passed to taskCallbacks
          let taskUpdates: Task[] = [];
          
          if (data.tasks?.cancelled) {
            const cancelledTasks = data.tasks.cancelled.map((task: any) => ({
              id: task.id,
              time: new Date(task.scheduledFor),
              description: task.message,
              status: 'cancelled',
              result: task.result,
              error: task.error
            }));
            console.log(`Received ${cancelledTasks.length} cancelled tasks`);
            // Add cancelled tasks to the combined array instead of separate callback
            taskUpdates = [...taskUpdates, ...cancelledTasks];
          }

          if (data.tasks?.failed) {
            const failedTasks = data.tasks.failed.map((task: any) => ({
              id: task.id,
              time: new Date(task.scheduledFor),
              description: task.message,
              status: 'failed',
              result: task.result,
              error: task.error
            }));
            console.log(`Received ${failedTasks.length} failed tasks`);
            // Add failed tasks to the combined array instead of separate callback
            taskUpdates = [...taskUpdates, ...failedTasks];
          }

          if (data.tasks?.scheduled) {
            console.log('Scheduled tasks:', data.tasks.scheduled);
            const scheduledTasks = data.tasks.scheduled
              .map((task: any) => ({
                id: task.id,
                status: 'scheduled',
                time: new Date(task.scheduledFor),
                description: task.message,
              }))
              .sort((a: Task, b: Task) => a.time.getTime() - b.time.getTime());

            console.log(`Received ${scheduledTasks.length} scheduled tasks`);
            // Add scheduled tasks to the combined array
            taskUpdates = [...taskUpdates, ...scheduledTasks];
          }

          // Call taskCallbacks once with all task updates
          if (taskUpdates.length > 0) {
            console.log(`Notifying callbacks with ${taskUpdates.length} total tasks`);
            taskCallbacks.forEach(callback => callback(taskUpdates));
          }

          if (data.tasks?.current) {
            const currentTask = data.tasks.current;
            const mappedTask: Task = {
              id: currentTask.id,
              time: new Date(currentTask.scheduledFor),
              description: currentTask.message,
              startedAt: currentTask.startedAt ? new Date(currentTask.startedAt) : undefined,
              status: currentTask.status,
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

export const subscribeToProcessingTasks = (callback: TaskUpdateCallback): (() => void) => {
  const processingCallback = (data: TaskEventMessage) => {
    if (data.type === 'tasks' && data.tasks?.current) {
      const currentTask = data.tasks.current;
      const processingTask: Task = {
        id: currentTask.id,
        time: new Date(currentTask.scheduledFor),
        description: currentTask.message,
        startedAt: currentTask.startedAt ? new Date(currentTask.startedAt) : undefined,
        status:
          currentTask.status === 'stopped'
            ? 'stopped'
            : currentTask.status === 'finalizing'
              ? 'finalizing'
              : 'processing',
      };

      callback([processingTask]);
    } else {
      callback([]);
    }
  };

  if (!isInitialized || connectionStatus === ConnectionStatus.DISCONNECTED) {
    connectToTaskStream();
  }

  // We're manually handling this by listening to task stream messages
  taskEventSource?.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data) as TaskEventMessage;
      processingCallback(data);
    } catch (error) {
      console.error('Error parsing processing task message:', error);
    }
  });

  return () => {
    // No need to do anything specific for cleanup as the main taskEventSource cleanup will handle it
  };
};

export const subscribeToCompletedTasks = (callback: TaskUpdateCallback): (() => void) => {
  const completedTasksCallback = (data: TaskEventMessage) => {
    if (data.type === 'tasks' && data.tasks?.completed) {
      const tasks = data.tasks.completed
        .map((task: any) => ({
          id: task.id,
          time: new Date(task.scheduledFor),
          description: task.message,
          startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
          status: task.status || 'completed',
          result:
            task.result ||
            (task.status === 'failed'
              ? 'Task execution failed'
              : task.status === 'deleted'
                ? 'Task was deleted'
                : task.status === 'cancelled'
                  ? 'Task was cancelled by user'
                  : task.status === 'stopped'
                    ? 'Task was stopped'
                    : 'Task completed successfully'),
        }))
        .sort((a: Task, b: Task) => b.time.getTime() - a.time.getTime());

      callback(tasks);
    } else {
      callback([]);
    }
  };

  if (!isInitialized || connectionStatus === ConnectionStatus.DISCONNECTED) {
    connectToTaskStream();
  }

  // We're manually handling this by listening to task stream messages
  taskEventSource?.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data) as TaskEventMessage;
      completedTasksCallback(data);
    } catch (error) {
      console.error('Error parsing completed task message:', error);
    }
  });

  return () => {
    // No need to do anything specific for cleanup as the main taskEventSource cleanup will handle it
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
    await apiRequest<void>(`/${namespace}/task/${taskId}`, {
      method: 'DELETE',
    });
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

const _connectToTaskStream = connectToTaskStream();
