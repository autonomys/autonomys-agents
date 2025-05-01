import React, { useState } from 'react';
import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import TaskHeader from './TaskHeader';
import ScheduledTasksBox from './ScheduledTasksBox';
import { Task } from '../../types/types';
import { ConnectionStatus } from '../../services/TaskStreamService';
import {
  containerStyles,
  contentContainerStyles,
  loadingContainerStyles,
  loadingTextStyles,
  resizableDefaultSize,
  resizableEnableProps,
} from './styles/TasksAreaStyles';
import { Resizable } from 're-resizable';

interface TasksAreaProps {
  tasks: {
    scheduled: Task[];
    processing: Task[];
    completed: Task[];
    cancelled: Task[];
    failed: Task[];
    deleted: Task[];
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
  const [size, setSize] = useState({ height: window.innerHeight - 600 });
  // Combine all tasks for display
  const allTasks = [
    ...tasks.cancelled,
    ...tasks.failed,
    ...tasks.processing,
    ...tasks.scheduled,
    ...tasks.completed,
    ...tasks.deleted,
  ];

  return (
    <Resizable
      defaultSize={resizableDefaultSize}
      size={{
        width: '100%',
        height: size.height,
      }}
      minHeight={150}
      maxHeight={800}
      onResizeStop={(e, direction, ref, d) => {
        setSize(prevSize => ({
          height: prevSize.height + d.height,
        }));
      }}
      enable={resizableEnableProps}
    >
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
            deletedTasks={tasks.deleted}
          />
        </Box>

        {loading && (
          <Flex {...loadingContainerStyles}>
            <Spinner size='sm' color='brand.neonBlue' />
            <Text {...loadingTextStyles}>Loading tasks...</Text>
          </Flex>
        )}
      </Flex>
    </Resizable>
  );
};

export default TasksArea;
