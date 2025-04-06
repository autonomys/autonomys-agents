import React, { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Badge, useToken } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { ScheduledTasksBoxProps, ScheduledTask } from '../../types/types';
import {
  resizableDefaultSize,
  resizableStyles,
  resizableEnableProps,
  resizableHandleStyles,
  resizableHandleBoxStyles,
  containerBoxStyles,
  scrollbarStyles,
  stackStyles,
  emptyStateStyles,
  taskListStyles,
  getTaskItemStyles,
  taskContentFlexStyles,
  taskHeaderFlexStyles,
  taskTimestampStyles,
  deleteButtonStyles,
  getTaskDescriptionStyles,
  getTaskStatusBadgeStyles,
  navTabsContainerStyles,
  neuralNetworkBgStyles,
  getTabItemStyles,
  activeTabDotStyles,
  taskResultBoxStyles,
  taskResultTextStyles
} from './styles/ScheduledTasksBoxStyles';

// Define the task types for the navbar
type TaskViewType = 'processing' | 'scheduled' | 'completed';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ 
  tasks, 
  onDeleteTask,
  processingTasks = [],
  scheduledTasks = [],
  completedTasks = [] 
}) => {
  const [size, setSize] = useState({ height: 200 });
  const [activeView, setActiveView] = useState<TaskViewType>('scheduled');
  // Get brand colors for the navbar
  const [neonBlue, neonGreen, neonPink] = useToken('colors', ['brand.neonBlue', 'brand.neonGreen', 'brand.neonPink']);

  // Filter tasks based on the active view
  const getTasksForActiveView = (): ScheduledTask[] => {
    if (activeView === 'processing') {
      return processingTasks.length ? processingTasks : tasks.filter(task => task.status === 'processing');
    } else if (activeView === 'scheduled') {
      return scheduledTasks.length ? scheduledTasks : tasks.filter(task => !task.status || task.status === 'scheduled');
    } else if (activeView === 'completed') {
      return completedTasks.length ? completedTasks : tasks.filter(task => task.status === 'completed' || task.status === 'failed');
    }
    return tasks;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray.500';

    switch (status.toLowerCase()) {
      case 'processing':
        return 'brand.neonBlue';
      case 'completed':
        return 'brand.neonGreen';
      case 'failed':
        return '#ef5350';
      default:
        return 'gray.500';
    }
  };

  const formatTime = (time: Date) => {
    return time.toISOString();
  };

  useEffect(() => {
    const handleResize = () => {
      setSize(prevSize => ({ ...prevSize }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get color for the active tab
  const getTabColor = (tabType: TaskViewType) => {
    if (tabType === activeView) {
      switch (tabType) {
        case 'processing':
          return neonBlue;
        case 'scheduled':
          return neonPink; 
        case 'completed':
          return neonGreen;
      }
    }
    return 'whiteAlpha.600';
  };

  // Get background for the active tab
  const getTabBackground = (tabType: TaskViewType) => {
    if (tabType === activeView) {
      switch (tabType) {
        case 'processing':
          return `rgba(0, 204, 255, 0.15)`;
        case 'scheduled':
          return `rgba(255, 0, 204, 0.15)`;
        case 'completed':
          return `rgba(50, 255, 126, 0.15)`;
      }
    }
    return 'transparent';
  };

  // Get the current view's tasks
  const currentViewTasks = getTasksForActiveView();

  return (
    <Resizable
      defaultSize={resizableDefaultSize}
      size={{
        width: '100%',
        height: size.height,
      }}
      minHeight={150}
      maxHeight={600}
      style={resizableStyles}
      onResizeStop={(e, direction, ref, d) => {
        setSize(prevSize => ({
          height: prevSize.height + d.height,
        }));
      }}
      enable={resizableEnableProps}
      handleStyles={{
        bottom: resizableHandleStyles,
      }}
      handleComponent={{
        bottom: (
          <Box {...resizableHandleBoxStyles} />
        ),
      }}
    >
      {/* Task Type Navigation Tabs */}
      <Flex {...navTabsContainerStyles}>
        {/* Neural network background effect */}
        <Box {...neuralNetworkBgStyles} />

        {/* Processing Tab */}
        <Flex
          {...getTabItemStyles(
            activeView === 'processing',
            getTabColor('processing'),
            getTabBackground('processing')
          )}
          onClick={() => setActiveView('processing')}
        >
          {/* Glowing dot for active tab */}
          {activeView === 'processing' && (
            <Box {...activeTabDotStyles(neonBlue)} />
          )}
          PROCESSING
        </Flex>

        {/* Scheduled Tab */}
        <Flex
          {...getTabItemStyles(
            activeView === 'scheduled',
            getTabColor('scheduled'),
            getTabBackground('scheduled')
          )}
          onClick={() => setActiveView('scheduled')}
        >
          {/* Glowing dot for active tab */}
          {activeView === 'scheduled' && (
            <Box {...activeTabDotStyles(neonPink)} />
          )}
          SCHEDULED
        </Flex>

        {/* Completed Tab */}
        <Flex
          {...getTabItemStyles(
            activeView === 'completed',
            getTabColor('completed'),
            getTabBackground('completed')
          )}
          onClick={() => setActiveView('completed')}
        >
          {/* Glowing dot for active tab */}
          {activeView === 'completed' && (
            <Box {...activeTabDotStyles(neonGreen)} />
          )}
          COMPLETED
        </Flex>
      </Flex>

      <Box
        {...containerBoxStyles}
        css={scrollbarStyles}
      >
        <Box {...stackStyles}>
          {currentViewTasks.length === 0 ? (
            <Box {...emptyStateStyles}>
              No {activeView} tasks
            </Box>
          ) : (
            <Box {...taskListStyles}>
              {currentViewTasks.map(task => {
                const statusColor = getStatusColor(task.status);

                return (
                  <Box
                    key={task.id}
                    {...getTaskItemStyles(statusColor)}
                  >
                    <Flex {...taskContentFlexStyles}>
                      <Flex {...taskHeaderFlexStyles}>
                        <Text {...taskTimestampStyles}>
                          {formatTime(task.time)}
                        </Text>
                        <Button
                          {...deleteButtonStyles}
                          onClick={() => onDeleteTask(task.id)}
                          title='Delete task'
                          aria-label='Delete task'
                        >
                          Delete
                        </Button>
                      </Flex>

                      <Text {...getTaskDescriptionStyles(!!task.status)}>
                        {task.description}
                      </Text>

                      {task.status && (
                        <Badge {...getTaskStatusBadgeStyles(statusColor)}>
                          {task.status}
                        </Badge>
                      )}

                      {/* Display result for completed tasks */}
                      {(activeView === 'completed' && task.result) && (
                        <Box {...taskResultBoxStyles(statusColor)}>
                          <Text {...taskResultTextStyles}>
                            Result: {task.result}
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Resizable>
  );
};

export default ScheduledTasksBox;
