import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  subscribeToTaskUpdates,
  closeTaskStream,
  ConnectionStatus,
  subscribeToConnectionStatus,
  reconnect,
  deleteTask,
  subscribeToCurrentTask,
} from '../../services/TaskStreamService';
import { ScheduledTask } from '../../types/types';
import InputArea from './workspace-elements/InputArea';
import TasksArea from './workspace-elements/TasksArea';
import './styles/BodyStyles.css';

const BodyArea: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [currentTask, setCurrentTask] = useState<ScheduledTask | undefined>(undefined);
  const [loading, setLoading] = useState(true);
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

      if (status === ConnectionStatus.CONNECTED && loading) {
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
    dispatch({ type: 'SET_VALUE', payload: value });
  };

  const handleInputSubmit = () => {
    if (state.value.trim() && !state.isProcessing) {
      dispatch({ type: 'SET_PROCESSING', payload: true });

      console.log('Processing input:', state.value);

      dispatch({ type: 'CLEAR_VALUE' });

      setTimeout(() => {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }, 2000);
    }
  };

  const handleDeleteTask = async (id: string) => {
    console.log(`Deleting task: ${id}`);
    setLoading(true);
    const success = await deleteTask(id);

    if (!success) {
      console.error('Failed to delete task');
      setLoading(false);
    }
  };

  const handleReconnect = useCallback(() => {
    console.log('Manual reconnect triggered from UI');
    setLoading(true);
    reconnect();
  }, []);

  const getConnectionStatusInfo = useCallback(() => {
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
  }, [connectionStatus]);

  const connectionStatusInfo = getConnectionStatusInfo();

  return (
    <div className='body-area'>
      <InputArea
        value={state.value}
        isProcessing={state.isProcessing}
        handleInputChange={handleInputChange}
        handleInputSubmit={handleInputSubmit}
        currentTask={currentTask}
      />
      <TasksArea
        tasks={tasks}
        loading={loading}
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleDeleteTask={handleDeleteTask}
        handleReconnect={handleReconnect}
      />
    </div>
  );
};

export default BodyArea;
