import React, { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Badge } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { ScheduledTasksBoxProps } from '../../types/types';
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
  getTaskStatusBadgeStyles
} from './styles/ScheduledTasksBoxStyles';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ tasks, onDeleteTask }) => {
  const [size, setSize] = useState({ height: 200 });

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
      <Box
        {...containerBoxStyles}
        css={scrollbarStyles}
      >
        <Box {...stackStyles}>
          {tasks.length === 0 ? (
            <Box {...emptyStateStyles}>
              No scheduled tasks
            </Box>
          ) : (
            <Box {...taskListStyles}>
              {tasks.map(task => {
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
