import React, { useState, useMemo } from 'react';
import { Box, Text, Button, Flex, Badge, useToken } from '@chakra-ui/react';
import { TasksAreaProps, Task } from '../../types/types';
import {
  containerBoxStyles,
  scrollbarStyles,
  stackStyles,
  emptyStateStyles,
  taskListStyles,
  getTaskItemStyles,
  taskContentFlexStyles,
  taskHeaderFlexStyles,
  taskTimestampStyles,
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
  getFilterCountBadgeStyles,
} from './styles/ScheduledTasksBoxStyles';
import { stopButtonStyles } from '../status/styles/StatusStyles';

// Define the task types for the navbar
type TaskViewType = 'processing' | 'scheduled' | 'completed';

// Define the filter status types for completed tasks
type CompletedFilterStatus = 'completed' | 'failed' | 'cancelled' | 'deleted';

const ScheduledTasksBox: React.FC<TasksAreaProps> = ({
  onDeleteTask,
  processingTasks = [],
  scheduledTasks = [],
  completedTasks = [],
  cancelledTasks = [],
  failedTasks = [],
  deletedTasks = [],
}) => {
  // Initial height calculation to match OutputLog component

  const [activeView, setActiveView] = useState<TaskViewType>('scheduled');
  const [activeFilters, setActiveFilters] = useState<CompletedFilterStatus[]>([
    'completed',
    'failed',
    'cancelled',
    'deleted',
  ]);

  // Get brand colors for the navbar
  const [neonBlue, neonGreen, neonPink, red] = useToken('colors', [
    'brand.neonBlue',
    'brand.neonGreen',
    'brand.neonPink',
    'red.400',
  ]);

  // Filter tasks based on the active view
  const getTasksForActiveView = (): Task[] => {
    const tasksToShow: Task[] = [];
    let uniqueTasks: Task[] = [];
    switch (activeView) {
      case 'processing':
        return processingTasks;
      case 'scheduled':
        return scheduledTasks;
      case 'completed':
        if (activeFilters.includes('completed')) {
          tasksToShow.push(...completedTasks);
        }
        if (activeFilters.includes('cancelled')) {
          tasksToShow.push(...cancelledTasks);
        }
        if (activeFilters.includes('failed')) {
          tasksToShow.push(...failedTasks);
        }
        if (activeFilters.includes('deleted')) {
          tasksToShow.push(...deletedTasks);
        }

        // Deduplicate tasks by ID
        uniqueTasks = Array.from(new Map(tasksToShow.map(task => [task.id, task])).values());

        return uniqueTasks;
      default:
        return [];
    }
  };

  // Task count for each filter type
  const filterCounts = useMemo(() => {
    return {
      completed: completedTasks.length,
      failed: failedTasks.length,
      cancelled: cancelledTasks.length,
      deleted: deletedTasks?.length,
    };
  }, [completedTasks, cancelledTasks, failedTasks, deletedTasks]);

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray.500';

    switch (status.toLowerCase()) {
      case 'processing':
        return 'brand.neonBlue';
      case 'scheduled':
        return 'brand.neonPink';
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
    <>
      {/* Task Type Navigation Tabs */}
      <Flex {...navTabsContainerStyles}>
        {/* Neural network background effect */}
        <Box {...neuralNetworkBgStyles} />

        {/* Processing Tab */}
        <Flex
          {...getTabItemStyles(
            activeView === 'processing',
            getTabColor('processing'),
            getTabBackground('processing'),
          )}
          onClick={() => setActiveView('processing')}
        >
          {/* Glowing dot for active tab */}
          {activeView === 'processing' && <Box {...activeTabDotStyles(neonBlue)} />}
          PROCESSING
        </Flex>

        {/* Scheduled Tab */}
        <Flex
          {...getTabItemStyles(
            activeView === 'scheduled',
            getTabColor('scheduled'),
            getTabBackground('scheduled'),
          )}
          onClick={() => setActiveView('scheduled')}
        >
          {/* Glowing dot for active tab */}
          {activeView === 'scheduled' && <Box {...activeTabDotStyles(neonPink)} />}
          SCHEDULED
        </Flex>

        {/* Completed Tab */}
        <Flex
          {...getTabItemStyles(
            activeView === 'completed',
            getTabColor('completed'),
            getTabBackground('completed'),
          )}
          onClick={() => setActiveView('completed')}
        >
          {/* Glowing dot for active tab */}
          {activeView === 'completed' && <Box {...activeTabDotStyles(neonGreen)} />}
          COMPLETED
        </Flex>
      </Flex>

      <Box {...containerBoxStyles} css={scrollbarStyles}>
        <Box {...stackStyles}>
          {/* Faceted Filter UI - Only show for completed view */}
          {activeView === 'completed' && (
            <Flex {...filterContainerStyles}>
              <Text {...filterLabelStyles}>FILTER:</Text>

              {/* Completed Filter */}
              <Box
                {...getFilterChipStyles(
                  activeFilters.includes('completed'),
                  getFilterColor('completed'),
                )}
                onClick={() => toggleFilter('completed')}
              >
                Completed
                <Box
                  {...getFilterCountBadgeStyles(
                    activeFilters.includes('completed'),
                    getFilterColor('completed'),
                  )}
                >
                  {filterCounts.completed}
                </Box>
              </Box>

              {/* Failed Filter */}
              <Box
                {...getFilterChipStyles(activeFilters.includes('failed'), getFilterColor('failed'))}
                onClick={() => toggleFilter('failed')}
              >
                Failed
                <Box
                  {...getFilterCountBadgeStyles(
                    activeFilters.includes('failed'),
                    getFilterColor('failed'),
                  )}
                >
                  {filterCounts.failed}
                </Box>
              </Box>

              {/* Cancelled Filter */}
              <Box
                {...getFilterChipStyles(
                  activeFilters.includes('cancelled'),
                  getFilterColor('cancelled'),
                )}
                onClick={() => toggleFilter('cancelled')}
              >
                Cancelled
                <Box
                  {...getFilterCountBadgeStyles(
                    activeFilters.includes('cancelled'),
                    getFilterColor('cancelled'),
                  )}
                >
                  {filterCounts.cancelled}
                </Box>
              </Box>

              {/* Deleted Filter */}
              <Box
                {...getFilterChipStyles(
                  activeFilters.includes('deleted'),
                  getFilterColor('deleted'),
                )}
                onClick={() => toggleFilter('deleted')}
              >
                Deleted
                <Box
                  {...getFilterCountBadgeStyles(
                    activeFilters.includes('deleted'),
                    getFilterColor('deleted'),
                  )}
                >
                  {filterCounts.deleted}
                </Box>
              </Box>
            </Flex>
          )}

          {currentViewTasks.length === 0 ? (
            <Box {...emptyStateStyles}>No {activeView} tasks</Box>
          ) : (
            <Box {...taskListStyles}>
              {currentViewTasks.map(task => {
                const statusColor = getStatusColor(task.status);

                return (
                  <Box key={task.id} {...getTaskItemStyles(statusColor)}>
                    <Flex {...taskContentFlexStyles}>
                      <Flex {...taskHeaderFlexStyles}>
                        <Text {...taskTimestampStyles}>{formatTime(task.time)}</Text>
                        {(task.status === 'completed' || task.status === 'scheduled') && (
                          <Flex gap={2}>
                            <Button
                              {...stopButtonStyles}
                              onClick={() => onDeleteTask(task.id)}
                              title='Delete task'
                              aria-label='Delete task'
                            >
                              Delete
                            </Button>
                          </Flex>
                        )}
                      </Flex>
                      <Text {...getTaskDescriptionStyles(!!task.status)}>{task.description}</Text>

                      {task.status && (
                        <Badge {...getTaskStatusBadgeStyles(statusColor)}>{task.status}</Badge>
                      )}

                      {/* Display result for completed tasks */}
                      {activeView === 'completed' && task.result && (
                        <Box {...taskResultBoxStyles(statusColor)}>
                          <Text {...taskResultTextStyles}>Result: {task.result}</Text>
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
    </>
  );
};

export default ScheduledTasksBox;
