import React, { useEffect, useState, useCallback } from 'react';
import { Flex, Box } from '@chakra-ui/react';
import { useAppContext } from '../context/AppContext';
import { useChatContext } from '../context/ChatContext';
import {
  subscribeToTaskUpdates,
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
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [currentTask, setCurrentTask] = useState<ScheduledTask | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );

  useEffect(() => {
    console.log('Setting up task stream subscriptions');
    setLoading(true);

    const unsubscribeFromTasks = subscribeToTaskUpdates(updatedTasks => {
      console.log(`Received ${updatedTasks.length} tasks from stream`);
      setTasks(updatedTasks);
      setLoading(false);
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
      unsubscribeFromTasks();
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

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} flex='1' p={4} gap={4} position='relative'>
      <Box flex={{ base: '1', lg: '3' }} position='relative' zIndex={5} minHeight='200px'>
        {chatState.activeChatNamespace ? (
          <ChatArea namespace={chatState.activeChatNamespace} onClose={handleCloseChat} />
        ) : (
          <InputArea
            value={state.value}
            handleInputChange={handleInputChange}
            handleInputSubmit={handleInputSubmit}
            currentTask={currentTask}
            error={error}
          />
        )}
      </Box>

      <Box
        flex={{ base: '1', lg: '2' }}
        display={{ base: 'block', lg: 'block' }}
        position='relative'
        zIndex={1}
        minHeight='200px'
      >
        <TasksArea
          tasks={tasks}
          loading={loading}
          connectionStatus={connectionStatus}
          connectionStatusInfo={connectionStatusInfo}
          handleDeleteTask={handleDeleteTask}
          handleReconnect={handleReconnect}
        />
      </Box>
    </Flex>
  );
};

export default BodyArea;
