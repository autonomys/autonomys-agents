import React from 'react';
import { Box, Heading, Text, Flex } from '@chakra-ui/react';
import { StatusBoxProps } from '../../types/types';

const StatusBox: React.FC<StatusBoxProps> = ({ status }) => {
  const getStatusColor = () => {
    if (status.startsWith('Running:') || status.startsWith('Processing:')) {
      return 'brand.neonBlue';
    } else if (status === 'Ready') {
      return 'brand.neonGreen';
    } else if (status.startsWith('Error:')) {
      return '#ef5350'; // Red
    } else {
      return 'gray.400';
    }
  };

  const getBgColor = () => {
    if (status.startsWith('Running:') || status.startsWith('Processing:')) {
      return 'rgba(0, 204, 255, 0.1)';
    } else if (status === 'Ready') {
      return 'rgba(0, 255, 153, 0.1)';
    } else if (status.startsWith('Error:')) {
      return 'rgba(239, 83, 80, 0.1)';
    } else {
      return 'rgba(0, 0, 0, 0.2)';
    }
  };

  const getStatusLabel = () => {
    if (status.includes(':')) {
      return status.split(':')[0];
    }
    return status;
  };

  const getStatusMessage = () => {
    if (status.includes(':')) {
      return status.substring(status.indexOf(':') + 1).trim();
    }
    return '';
  };

  const statusColor = getStatusColor();
  const bgColor = getBgColor();
  const statusLabel = getStatusLabel();
  const statusMessage = getStatusMessage();
  const isReady = status === 'Ready';

  return (
    <Box
      p={4}
      bg="rgba(26, 26, 46, 0.8)"
      borderRadius="md"
      boxShadow="0 4px 8px rgba(0, 0, 0, 0.3)"
      backdropFilter="blur(8px)"
      border="1px solid"
      borderColor="gray.700"
      position="relative"
      minH="150px"
      display="flex"
      flexDirection="column"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        bgGradient: `linear(to-r, transparent, ${statusColor}, transparent)`,
      }}
    >
      <Heading
        as="h3"
        size="md"
        mb={3}
        color="brand.neonGreen"
        textShadow="0 0 5px rgba(0, 255, 153, 0.5)"
        display="flex"
        alignItems="center"
        gap={2}
        fontSize={["md", "lg", "xl"]}
      >
        <Box
          as="span"
          w="8px"
          h="8px"
          borderRadius="full"
          bg={statusColor}
          boxShadow={`0 0 8px ${statusColor}`}
          animation="pulse 2s infinite"
        />
        Status
      </Heading>
      
      <Box
        p={3}
        bg={bgColor}
        borderRadius="md"
        borderLeft="3px solid"
        borderColor={statusColor}
        transition="all 0.2s ease"
        flex="1"
        maxH="240px"
        overflowY="auto"
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0, 0, 0, 0.1)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: `${statusColor}40`,
            borderRadius: "3px",
          }
        }}
      >
        {isReady ? (
          <Text 
            fontWeight="500" 
            color={statusColor}
            fontSize={["sm", "md", "lg"]}
          >
            Ready for input
          </Text>
        ) : (
          <Flex direction="column">
            <Text 
              fontWeight="600" 
              color={statusColor} 
              mb={statusMessage ? 2 : 0}
              fontSize={["sm", "md", "lg"]}
            >
              {statusLabel}
            </Text>
            {statusMessage && (
              <Text 
                fontSize={["sm", "md"]}
                fontWeight="normal" 
                color="whiteAlpha.800"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
                lineHeight="1.6"
              >
                {statusMessage}
              </Text>
            )}
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default StatusBox;
