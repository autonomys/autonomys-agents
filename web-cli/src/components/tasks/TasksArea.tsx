import React from 'react';
import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import TaskHeader from './TaskHeader';
import ScheduledTasksBox from './ScheduledTasksBox';
import { Task } from '../../types/types';
import { ConnectionStatus } from '../../services/TaskStreamService';
import {
  containerStyles,
  contentContainerStyles,
  loadingContainerStyles,
  loadingTextStyles
} from './styles/TasksAreaStyles';

interface TasksAreaProps {
  tasks: {
    scheduled: Task[];
    processing: Task[];
    completed: Task[];
    cancelled: Task[];
    failed: Task[];
  };
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
  // Combine all tasks for display
  const allTasks = [
    ...tasks.cancelled,
    ...tasks.failed,
    ...tasks.processing,
    ...tasks.scheduled,
    ...tasks.completed
  ];

  return (
    <Flex {...containerStyles}>
      <TaskHeader
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleReconnect={handleReconnect}
      />
      <Box {...contentContainerStyles}>
        <ScheduledTasksBox 
          tasks={allTasks} 
          onDeleteTask={handleDeleteTask}
          processingTasks={tasks.processing}
          scheduledTasks={tasks.scheduled}
          completedTasks={tasks.completed}
          cancelledTasks={tasks.cancelled}
          failedTasks={tasks.failed}
        />
      </Box>

      {loading && (
        <Flex {...loadingContainerStyles}>
          <Spinner size='sm' color='brand.neonBlue' />
          <Text {...loadingTextStyles}>
            Loading tasks...
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default TasksArea;
