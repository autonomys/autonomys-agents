import React from 'react';
import TaskHeader from './TaskHeader';
import ScheduledTasksBox from '../ScheduledTasksBox';
import { ScheduledTask } from '../../../types/types';
import { ConnectionStatus } from '../../../services/TaskStreamService';
import '../styles/BodyStyles.css';

interface TasksAreaProps {
  tasks: ScheduledTask[];
  loading: boolean;
  connectionStatus: ConnectionStatus;
  connectionStatusInfo: {
    message: string;
    className: string;
  };
  handleDeleteTask: (id: string) => void;
  handleReconnect: () => void;
}

const TasksArea: React.FC<TasksAreaProps> = ({
  tasks,
  loading,
  connectionStatus,
  connectionStatusInfo,
  handleDeleteTask,
  handleReconnect,
}) => {
  return (
    <div className='body-right-section'>
      <TaskHeader
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleReconnect={handleReconnect}
      />
      <ScheduledTasksBox tasks={tasks} onDeleteTask={handleDeleteTask} />
      {loading && <div className='loading-indicator'>Loading tasks...</div>}
    </div>
  );
};

export default TasksArea;
