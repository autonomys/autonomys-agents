import React from 'react';
import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import TaskHeader from './TaskHeader';
import ScheduledTasksBox from './ScheduledTasksBox';
import { ScheduledTask } from '../../types/types';
import { ConnectionStatus } from '../../services/TaskStreamService';

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
    <Flex 
      direction="column" 
      flex="1" 
      borderLeft="1px solid" 
      borderColor="gray.700"
      minHeight="200px"
      width="100%"
      bg="rgba(26, 26, 46, 0.6)"
      boxShadow="inset 0 0 20px rgba(0, 0, 0, 0.3)"
      overflow="visible"
      position="relative"
    >
      <TaskHeader
        connectionStatus={connectionStatus}
        connectionStatusInfo={connectionStatusInfo}
        handleReconnect={handleReconnect}
      />
      <Box pt={1} px={2} flex="1" display="flex" flexDirection="column">
        <ScheduledTasksBox tasks={tasks} onDeleteTask={handleDeleteTask} />
      </Box>
      
      {loading && (
        <Flex 
          position="absolute"
          bottom="20px"
          right="20px"
          bg="rgba(0, 0, 0, 0.7)"
          p={2}
          borderRadius="md"
          alignItems="center"
          gap={2}
          boxShadow="0 0 10px rgba(0, 0, 0, 0.3)"
          border="1px solid"
          borderColor="gray.700"
          zIndex="1"
        >
          <Spinner size="sm" color="brand.neonBlue" />
          <Text fontSize="sm" color="whiteAlpha.800">Loading tasks...</Text>
        </Flex>
      )}
    </Flex>
  );
};

export default TasksArea;
