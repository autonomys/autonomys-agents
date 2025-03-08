import React from 'react';
import { Box, Text, Button, Flex, Stack, Badge } from '@chakra-ui/react';
import { ScheduledTasksBoxProps } from '../../types/types';

const ScheduledTasksBox: React.FC<ScheduledTasksBoxProps> = ({ tasks, onDeleteTask }) => {
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
    return time.toISOString().replace('T', ' ').substring(0, 19);
  };

  return (
    <Box
      flex="1"
      overflow="auto"
      p={4}
      bg="rgba(20, 20, 20, 0.7)"
      backdropFilter="blur(5px)"
      css={{
        "&::-webkit-scrollbar": {
          width: "8px",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-track": {
          background: "rgba(0, 0, 0, 0.1)",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(0, 204, 255, 0.3)",
          borderRadius: "4px",
        }
      }}
    >
      <Stack direction="column" w="100%">
        {tasks.length === 0 ? (
          <Box 
            textAlign="center" 
            py={8} 
            color="whiteAlpha.600" 
            fontSize={["sm", "md"]}
            fontStyle="italic"
            bgGradient="linear(to-b, rgba(0, 0, 0, 0), rgba(0, 204, 255, 0.05), rgba(0, 0, 0, 0))"
            borderRadius="md"
            p={4}
          >
            No scheduled tasks
          </Box>
        ) : (
          <Box as="ul" m={0} p={0} listStyleType="none">
            {tasks.map(task => {
              const statusColor = getStatusColor(task.status);
              
              return (
                <Box 
                  as="li" 
                  key={task.id} 
                  p={3}
                  mb={3}
                  borderRadius="md"
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="gray.700"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: "brand.neonBlue",
                    boxShadow: "0 0 12px rgba(0, 204, 255, 0.2)"
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
                  <Flex direction="column" gap={2} pl={2}>
                    <Flex justifyContent="space-between" alignItems="flex-start">
                      <Text 
                        fontSize={["xs", "sm"]} 
                        color="whiteAlpha.700" 
                        fontFamily="monospace"
                        fontWeight="medium"
                      >
                        {formatTime(task.time)}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        minW="auto"
                        h="auto"
                        p={1}
                        _hover={{ 
                          bg: "rgba(255, 0, 0, 0.1)", 
                          color: "#ef5350"
                        }}
                        _active={{
                          bg: "rgba(255, 0, 0, 0.2)"
                        }}
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        ×
                      </Button>
                    </Flex>
                    
                    <Text 
                      fontSize={["sm", "md"]} 
                      fontWeight="medium" 
                      color="white"
                      mb={task.status ? 2 : 0}
                    >
                      {task.description}
                    </Text>
                    
                    {task.status && (
                      <Badge 
                        w="fit-content"
                        px={2} 
                        py={1} 
                        borderRadius="full" 
                        fontSize={["xs", "sm"]}
                        bg={`${statusColor}20`}
                        color={statusColor}
                        textTransform="capitalize"
                        fontWeight="medium"
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
  );
};

export default ScheduledTasksBox;
