import React, { useState, useEffect, useMemo } from 'react';
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
  taskResultTextStyles,
  filterContainerStyles,
  filterLabelStyles,
  getFilterChipStyles,
  getFilterCountBadgeStyles
} from './styles/ScheduledTasksBoxStyles';

// Define the task types for the navbar
type TaskViewType = 'processing' | 'scheduled' | 'completed';

// Define the filter status types for completed tasks
type CompletedFilterStatus = 'completed' | 'failed' | 'cancelled' | 'deleted';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ 
  tasks, 
  onDeleteTask,
  processingTasks = [],
  scheduledTasks = [],
  completedTasks = [] 
}) => {
  const [size, setSize] = useState({ height: 200 });
  const [activeView, setActiveView] = useState<TaskViewType>('scheduled');
  const [activeFilters, setActiveFilters] = useState<CompletedFilterStatus[]>(['completed', 'failed', 'cancelled', 'deleted']);
  
  // Get brand colors for the navbar
  const [neonBlue, neonGreen, neonPink, red] = useToken('colors', ['brand.neonBlue', 'brand.neonGreen', 'brand.neonPink', 'red.400']);

  // Filter tasks based on the active view
  const getTasksForActiveView = (): ScheduledTask[] => {
    if (activeView === 'processing') {
      return processingTasks.length ? processingTasks : tasks.filter(task => task.status === 'processing' || task.status === 'finalizing');
    } else if (activeView === 'scheduled') {
      return scheduledTasks.length ? scheduledTasks : tasks.filter(task => !task.status || task.status === 'scheduled');
    } else if (activeView === 'completed') {
      const allCompletedTasks = completedTasks.length 
        ? completedTasks 
        : tasks.filter(task => 
            task.status === 'completed' || 
            task.status === 'failed' || 
            task.status === 'cancelled' || 
            task.status === 'deleted'
          );
          
      // Apply active filters for completed view
      return allCompletedTasks.filter(task => activeFilters.includes(task.status as CompletedFilterStatus));
    }
    return tasks;
  };

  // Task count for each filter type
  const filterCounts = useMemo(() => {
    const allCompletedTasks = completedTasks.length 
      ? completedTasks 
      : tasks.filter(task => 
          task.status === 'completed' || 
          task.status === 'failed' || 
          task.status === 'cancelled' ||
          task.status === 'deleted'
        );
    
    return {
      completed: allCompletedTasks.filter(task => task.status === 'completed').length,
      failed: allCompletedTasks.filter(task => task.status === 'failed').length,
      cancelled: allCompletedTasks.filter(task => task.status === 'cancelled').length,
      deleted: allCompletedTasks.filter(task => task.status === 'deleted').length
    };
  }, [completedTasks, tasks]);

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray.500';

    switch (status.toLowerCase()) {
      case 'processing':
        return 'brand.neonBlue';
      case 'finalizing':
        return 'yellow.300';
      case 'completed':
        return 'brand.neonGreen';
      case 'failed':
        return '#ef5350';
      case 'cancelled':
        return 'purple.300';
      case 'deleted':
        return 'gray.400';
      case 'stopped':
        return 'orange.300';
      default:
        return 'gray.500';
    }
  };

  const getFilterColor = (filterStatus: CompletedFilterStatus) => {
    switch (filterStatus) {
      case 'completed':
        return neonGreen;
      case 'failed':
        return '#ef5350';
      case 'cancelled':
        return 'purple.300';
      case 'deleted':
        return 'gray.400';
      default:
        return 'whiteAlpha.600';
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

  // Toggle a filter on/off
  const toggleFilter = (filterStatus: CompletedFilterStatus) => {
    setActiveFilters(prev => {
      // If it's the only filter left, don't remove it
      if (prev.length === 1 && prev.includes(filterStatus)) {
        return prev;
      }
      
      // If filter is already active, remove it
      if (prev.includes(filterStatus)) {
        return prev.filter(f => f !== filterStatus);
      }
      // Otherwise add it
      return [...prev, filterStatus];
    });
  };

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
          {/* Faceted Filter UI - Only show for completed view */}
          {activeView === 'completed' && (
            <Flex {...filterContainerStyles}>
              <Text {...filterLabelStyles}>FILTER:</Text>
              
              {/* Completed Filter */}
              <Box 
                {...getFilterChipStyles(
                  activeFilters.includes('completed'), 
                  getFilterColor('completed')
                )}
                onClick={() => toggleFilter('completed')}
              >
                Completed
                <Box {...getFilterCountBadgeStyles(
                  activeFilters.includes('completed'),
                  getFilterColor('completed')
                )}>
                  {filterCounts.completed}
                </Box>
              </Box>
              
              {/* Failed Filter */}
              <Box 
                {...getFilterChipStyles(
                  activeFilters.includes('failed'), 
                  getFilterColor('failed')
                )}
                onClick={() => toggleFilter('failed')}
              >
                Failed
                <Box {...getFilterCountBadgeStyles(
                  activeFilters.includes('failed'),
                  getFilterColor('failed')
                )}>
                  {filterCounts.failed}
                </Box>
              </Box>
              
              {/* Cancelled Filter */}
              <Box 
                {...getFilterChipStyles(
                  activeFilters.includes('cancelled'), 
                  getFilterColor('cancelled')
                )}
                onClick={() => toggleFilter('cancelled')}
              >
                Cancelled
                <Box {...getFilterCountBadgeStyles(
                  activeFilters.includes('cancelled'),
                  getFilterColor('cancelled')
                )}>
                  {filterCounts.cancelled}
                </Box>
              </Box>
              
              {/* Deleted Filter */}
              <Box 
                {...getFilterChipStyles(
                  activeFilters.includes('deleted'), 
                  getFilterColor('deleted')
                )}
                onClick={() => toggleFilter('deleted')}
              >
                Deleted
                <Box {...getFilterCountBadgeStyles(
                  activeFilters.includes('deleted'),
                  getFilterColor('deleted')
                )}>
                  {filterCounts.deleted}
                </Box>
              </Box>
            </Flex>
          )}

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
