import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useChatContext } from '../context/ChatContext';
import {
  subscribeToTaskUpdates,
  subscribeToProcessingTasks,
  subscribeToCompletedTasks,
  closeTaskStream,
  ConnectionStatus,
  subscribeToConnectionStatus,
  reconnect,
  deleteTask,
  subscribeToCurrentTask,
} from '../services/TaskStreamService';
import { runWorkflow, stopWorkflow } from '../services/WorkflowService';
import { Task } from '../types/types';

export const useTaskManager = () => {
  const { state, dispatch } = useAppContext();
  const { state: chatState, dispatch: chatDispatch } = useChatContext();
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([]);
  const [processingTasks, setProcessingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [cancelledTasks, setCancelledTasks] = useState<Task[]>([]);
  const [failedTasks, setFailedTasks] = useState<Task[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [stopStatus, setStopStatus] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );

  useEffect(() => {
    console.log('Setting up task stream subscriptions');
    setLoading(true);

    const unsubscribeFromScheduledTasks = subscribeToTaskUpdates(updatedTasks => {
      // Categorize tasks by status
      const scheduled: Task[] = [];
      const cancelled: Task[] = [];
      const failed: Task[] = [];
      const completed: Task[] = [];
      const deleted: Task[] = [];
      updatedTasks.forEach(task => {
        // Ensure each task only goes to one category
        switch (task.status) {
          case 'cancelled':
            cancelled.push(task);
            break;
          case 'failed':
            failed.push(task);
            break;
          case 'completed':
            completed.push(task);
            break;
          case 'scheduled':
            scheduled.push(task);
            break;
          case 'deleted':
            deleted.push(task);
            break;
          case 'processing':
            // Only processing tasks go here
            break;
          case 'finalizing':
            // These are handled by the processingTasks subscription
            break;
        }
      });

      // Update the appropriate state variables
      setScheduledTasks(current => {
        const newTasks = scheduled.filter(task => !current.some(t => t.id === task.id));
        return [...current, ...newTasks];
      });
      setCancelledTasks(current => {
        const newTasks = cancelled.filter(task => !current.some(t => t.id === task.id));
        return [...current, ...newTasks];
      });
      setFailedTasks(current => {
        const newTasks = failed.filter(task => !current.some(t => t.id === task.id));
        return [...current, ...newTasks];
      });
      setCompletedTasks(current => {
        const newTasks = completed.filter(task => !current.some(t => t.id === task.id));
        return [...current, ...newTasks];
      });
      setDeletedTasks(current => {
        const newTasks = deleted.filter(task => !current.some(t => t.id === task.id));
        return [...current, ...newTasks];
      });
      setLoading(false);
    });

    const unsubscribeFromProcessingTasks = subscribeToProcessingTasks(updatedTasks => {
      // When a task starts processing, remove it from scheduled list
      if (updatedTasks.length > 0) {
        const processingIds = new Set(updatedTasks.map(task => task.id));
        setScheduledTasks(current => current.filter(task => !processingIds.has(task.id)));
      }
      setProcessingTasks(updatedTasks);
    });

    const unsubscribeFromCompletedTasks = subscribeToCompletedTasks(updatedTasks => {
      setCompletedTasks(current => {
        const existingTaskIds = new Set(current.map(task => task.id));
        const newTasks = updatedTasks.filter(task => !existingTaskIds.has(task.id));

        if (newTasks.length > 0) {
          return [...current, ...newTasks];
        }
        return current;
      });
    });

    const unsubscribeFromStatus = subscribeToConnectionStatus(status => {
      setConnectionStatus(status);

      if (status === ConnectionStatus.CONNECTED) {
        setLoading(false);
      }
    });

    const unsubscribeFromCurrentTask = subscribeToCurrentTask(task => {
      setCurrentTask(task);
    });

    return () => {
      unsubscribeFromScheduledTasks();
      unsubscribeFromProcessingTasks();
      unsubscribeFromCompletedTasks();
      unsubscribeFromStatus();
      unsubscribeFromCurrentTask();
      closeTaskStream();
    };
  }, []);

  // Update tabIndex when showChat changes
  useEffect(() => {
    setTabIndex(chatState.activeChatNamespace ? 1 : 0);
  }, [chatState.activeChatNamespace]);

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    if (index === 1) {
      // When Chat tab is selected, activate the chat component
      chatDispatch({ type: 'SET_ACTIVE_CHAT', payload: 'default' });
    } else if (index === 0 && chatState.activeChatNamespace) {
      // When Agent tab is selected and chat is open, close the chat
      chatDispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
    }
  };

  const getStatusText = () => {
    if (stopStatus) {
      return stopStatus;
    }

    if (currentTask) {
      const taskStatus = currentTask.status || 'processing';

      // Check for stopped status (previously finalizing)
      if (taskStatus === 'stopped') {
        return `Stopped: ${currentTask.description}`;
      }
      // Also check for failed tasks with appropriate result message
      else if (
        taskStatus === 'failed' &&
        currentTask.result &&
        currentTask.result.includes('Stopped by user')
      ) {
        return `Stopped: ${currentTask.description}`;
      }

      const formattedStatus = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1);
      return `${formattedStatus}: ${currentTask.description}`;
    } else if (error) {
      return `Error: ${error}`;
    } else {
      return 'Ready';
    }
  };

  const handleStopWorkflow = async () => {
    try {
      // Immediately set to "Stopped" status
      setStopStatus(`Stopped: ${currentTask?.description || ''}`);

      // Send the stop request
      const _stopWorkflow = await stopWorkflow();

      // Keep showing the "Stopped" status for a while
      setTimeout(() => {
        setStopStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error stopping workflow:', error);
      setStopStatus('Error: Failed to stop the workflow. Please try again.');

      // Clear the error message after a delay
      setTimeout(() => {
        setStopStatus(null);
      }, 5000);
    }
  };

  const handleInputChange = (value: string) => {
    if (error) setError(undefined);
    dispatch({ type: 'SET_VALUE', payload: value });
  };

  const handleInputSubmit = async () => {
    if (state.value.trim()) {
      setError(undefined);
      dispatch({ type: 'CLEAR_VALUE' });

      console.log('Processing input:', state.value);

      try {
        const _result = await runWorkflow(state.value);
      } catch (error) {
        console.error('Error running workflow:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  };

  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        setScheduledTasks(current => current.filter(task => task.id !== id));
        const deletedTask = scheduledTasks.find(task => task.id === id);
        if (deletedTask) {
          // Add it to deleted tasks with updated status
          const taskWithDeletedStatus = {
            ...deletedTask,
            status: 'deleted',
            result: 'Task was deleted by user',
          };
          setDeletedTasks(current => [...current, taskWithDeletedStatus]);
        }
        await deleteTask(id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    },
    [scheduledTasks],
  );

  const handleReconnect = useCallback(() => {
    reconnect();
  }, []);

  const handleCloseChat = useCallback(() => {
    chatDispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
  }, [chatDispatch]);

  const connectionStatusInfo = (() => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return { message: 'Connected', className: 'connection-status-connected' };
      case ConnectionStatus.CONNECTING:
        return { message: 'Connecting...', className: 'connection-status-connecting' };
      case ConnectionStatus.DISCONNECTED:
        return { message: 'Disconnected', className: 'connection-status-disconnected' };
      case ConnectionStatus.ERROR:
        return { message: 'Connection Error', className: 'connection-status-error' };
      default:
        return { message: 'Unknown', className: 'connection-status-unknown' };
    }
  })();

  // Combine all tasks for the TasksArea
  const allTasks = {
    scheduled: scheduledTasks,
    processing: processingTasks,
    completed: completedTasks,
    cancelled: cancelledTasks,
    failed: failedTasks,
    deleted: deletedTasks,
  };

  // Return all the state and functions to be used in the component
  return {
    // State
    state,
    chatState,
    scheduledTasks,
    processingTasks,
    completedTasks,
    cancelledTasks,
    failedTasks,
    deletedTasks,
    currentTask,
    loading,
    error,
    stopStatus,
    tabIndex,
    connectionStatus,
    
    // Handlers
    handleTabChange,
    getStatusText,
    handleStopWorkflow,
    handleInputChange,
    handleInputSubmit,
    handleDeleteTask,
    handleReconnect,
    handleCloseChat,
    
    // Computed values
    connectionStatusInfo,
    allTasks,
  };
}; 