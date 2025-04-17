import React, { useEffect, useState, useCallback } from 'react';
import { Flex, Box } from '@chakra-ui/react';
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
import { runWorkflow } from '../services/WorkflowService';
import { ScheduledTask } from '../types/types';
import InputArea from './input/InputArea';
import TasksArea from './tasks/TasksArea';
import ChatArea from './chat/ChatArea';

const BodyArea: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { state: chatState, dispatch: chatDispatch } = useChatContext();
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [processingTasks, setProcessingTasks] = useState<ScheduledTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ScheduledTask[]>([]);
  const [currentTask, setCurrentTask] = useState<ScheduledTask | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );

  useEffect(() => {
    console.log('Setting up task stream subscriptions');
    setLoading(true);

    const unsubscribeFromScheduledTasks = subscribeToTaskUpdates(updatedTasks => {
      console.log(`Received ${updatedTasks.length} scheduled tasks from stream`);
      setScheduledTasks(updatedTasks);
      setLoading(false);
    });

    const unsubscribeFromProcessingTasks = subscribeToProcessingTasks(updatedTasks => {
      console.log(`Received ${updatedTasks.length} processing tasks from stream`);
      setProcessingTasks(updatedTasks);
    });

    const unsubscribeFromCompletedTasks = subscribeToCompletedTasks(updatedTasks => {
      console.log(`Received ${updatedTasks.length} completed tasks from stream`);
      setCompletedTasks(updatedTasks);
    });

    const unsubscribeFromStatus = subscribeToConnectionStatus(status => {
      console.log(`Connection status changed to: ${status}`);
      setConnectionStatus(status);

      if (status === ConnectionStatus.CONNECTED) {
        setLoading(false);
      }
    });

    const unsubscribeFromCurrentTask = subscribeToCurrentTask(task => {
      console.log('Current task update:', task);
      setCurrentTask(task);
    });

    return () => {
      console.log('Cleaning up task stream subscriptions');
      unsubscribeFromScheduledTasks();
      unsubscribeFromProcessingTasks();
      unsubscribeFromCompletedTasks();
      unsubscribeFromStatus();
      unsubscribeFromCurrentTask();
      closeTaskStream();
    };
  }, []);

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

  const handleDeleteTask = useCallback(async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, []);

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
  };

  return (
    <Flex className='left-panel' direction='column' position='relative' height='100%' pb={0}>
      {chatState.activeChatNamespace ? (
        <ChatArea namespace={chatState.activeChatNamespace} onClose={handleCloseChat} />
      ) : (
        <>
          <Box flex='0 0 auto' mb={2}>
            <InputArea
              value={state.value}
              handleInputChange={handleInputChange}
              handleInputSubmit={handleInputSubmit}
              currentTask={currentTask}
              error={error}
            />
          </Box>
          <Box flex='1' mb={0}>
            <TasksArea
              tasks={allTasks}
              loading={loading}
              connectionStatus={connectionStatus}
              connectionStatusInfo={connectionStatusInfo}
              handleDeleteTask={handleDeleteTask}
              handleReconnect={handleReconnect}
            />
          </Box>
        </>
      )}
    </Flex>
  );
};

export default BodyArea;
