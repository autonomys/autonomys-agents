import React, { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Stack, Badge } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { ScheduledTasksBoxProps } from '../../types/types';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ tasks, onDeleteTask }) => {
  // Use same height as InputBox
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
    return time.toISOString(); // Return the full ISO format (e.g., 2025-03-09T01:32:26.997Z)
  };

  // Ensure the component updates if the window resizes
  useEffect(() => {
    const handleResize = () => {
      // Force component update when window resizes
      setSize(prevSize => ({ ...prevSize }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Resizable
      defaultSize={{
        width: '100%',
        height: 200, // Initial height (same as InputBox)
      }}
      size={{
        width: '100%',
        height: size.height,
      }}
      minHeight={150}
      maxHeight={600}
      style={{
        margin: '0',
        flex: '1',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      onResizeStop={(e, direction, ref, d) => {
        setSize(prevSize => ({
          height: prevSize.height + d.height,
        }));
      }}
      enable={{
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      handleStyles={{
        bottom: {
          height: '8px',
          borderRadius: '0 0 6px 6px',
          backgroundColor: 'transparent',
          backgroundImage:
            'linear-gradient(to right, transparent, rgba(0, 204, 255, 0.4), transparent)',
          bottom: '0px',
          cursor: 'row-resize',
          zIndex: 11,
        },
      }}
      handleComponent={{
        bottom: (
          <Box
            width='100%'
            height='8px'
            position='absolute'
            bottom='0'
            cursor='row-resize'
            borderRadius='0 0 6px 6px'
            zIndex={11}
            _hover={{
              backgroundImage:
                'linear-gradient(to right, transparent, rgba(0, 204, 255, 0.8), transparent)',
              opacity: 0.7,
            }}
          />
        ),
      }}
    >
      <Box
        flex='1'
        overflow='auto'
        p={4}
        bg='rgba(20, 20, 20, 0.7)'
        backdropFilter='blur(5px)'
        height='100%'
        width='100%'
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 204, 255, 0.3)',
            borderRadius: '4px',
          },
        }}
      >
        <Stack direction='column' w='100%'>
          {tasks.length === 0 ? (
            <Box
              textAlign='center'
              py={8}
              color='whiteAlpha.600'
              fontSize={['sm', 'md']}
              fontStyle='italic'
              bgGradient='linear(to-b, rgba(0, 0, 0, 0), rgba(0, 204, 255, 0.05), rgba(0, 0, 0, 0))'
              borderRadius='md'
              p={4}
            >
              No scheduled tasks
            </Box>
          ) : (
            <Box as='ul' m={0} p={0} listStyleType='none'>
              {tasks.map(task => {
                const statusColor = getStatusColor(task.status);

                return (
                  <Box
                    as='li'
                    key={task.id}
                    p={3}
                    mb={3}
                    borderRadius='md'
                    bg='rgba(0, 0, 0, 0.3)'
                    border='1px solid'
                    borderColor='gray.700'
                    position='relative'
                    overflow='hidden'
                    transition='all 0.2s ease'
                    _hover={{
                      borderColor: 'brand.neonBlue',
                      boxShadow: '0 0 12px rgba(0, 204, 255, 0.2)',
                    }}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '2px',
                      height: '100%',
                      bg: statusColor,
                      boxShadow: `0 0 8px ${statusColor}`,
                    }}
                  >
                    <Flex direction='column' gap={2} pl={2}>
                      <Flex justifyContent='space-between' alignItems='flex-start'>
                        <Text
                          fontSize={['xs', 'sm']}
                          color='whiteAlpha.700'
                          fontFamily='monospace'
                          fontWeight='medium'
                        >
                          {formatTime(task.time)}
                        </Text>
                        <Button
                          size='sm'
                          variant='ghost'
                          color='gray.400'
                          minW='auto'
                          h='auto'
                          p={2}
                          fontWeight='bold'
                          fontSize='md'
                          borderRadius='md'
                          _hover={{
                            bg: 'rgba(255, 0, 0, 0.2)',
                            color: '#ef5350',
                            transform: 'scale(1.05)',
                          }}
                          _active={{
                            bg: 'rgba(255, 0, 0, 0.3)',
                            transform: 'scale(0.95)',
                          }}
                          onClick={() => onDeleteTask(task.id)}
                          title='Delete task'
                          aria-label='Delete task'
                        >
                          Delete
                        </Button>
                      </Flex>

                      <Text
                        fontSize={['sm', 'md']}
                        fontWeight='medium'
                        color='white'
                        mb={task.status ? 2 : 0}
                      >
                        {task.description}
                      </Text>

                      {task.status && (
                        <Badge
                          w='fit-content'
                          px={2}
                          py={1}
                          borderRadius='full'
                          fontSize={['xs', 'sm']}
                          bg={`${statusColor}20`}
                          color={statusColor}
                          textTransform='capitalize'
                          fontWeight='medium'
                          boxShadow={`0 0 5px ${statusColor}50`}
                        >
                          {task.status}
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          )}
        </Stack>
      </Box>
    </Resizable>
  );
};

export default ScheduledTasksBox;
