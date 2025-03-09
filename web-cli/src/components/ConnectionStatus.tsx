import React from 'react';
import { Box, Text, Button, Flex } from '@chakra-ui/react';
import { ConnectionStatus } from '../services/TaskStreamService';

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatus;
  connectionStatusInfo: {
    message: string;
    className: string;
  };
  handleReconnect: () => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  connectionStatusInfo,
  handleReconnect,
}) => {
  // Map CSS class names to Chakra UI colors
  const getStatusColor = () => {
    switch (connectionStatusInfo.className) {
      case 'connection-status-connected':
        return 'brand.neonGreen';
      case 'connection-status-connecting':
        return 'brand.neonBlue';
      case 'connection-status-disconnected':
        return 'orange.400';
      case 'connection-status-error':
        return '#ef5350';
      default:
        return 'gray.400';
    }
  };

  const statusColor = getStatusColor();
  const isDisconnected =
    connectionStatus === ConnectionStatus.DISCONNECTED ||
    connectionStatus === ConnectionStatus.ERROR;

  return (
    <Flex alignItems='center' gap={2}>
      <Box
        width='8px'
        height='8px'
        borderRadius='full'
        bg={statusColor}
        boxShadow={`0 0 8px ${statusColor}`}
        animation={isDisconnected ? 'none' : 'pulse 2s infinite'}
        mr={1}
      />
      <Text
        fontSize={['xs', 'sm', 'md']}
        fontWeight='medium'
        color={statusColor}
        textShadow={`0 0 5px ${statusColor}`}
      >
        {connectionStatusInfo.message}
      </Text>
      {isDisconnected && (
        <Button
          size={['xs', 'sm']}
          ml={2}
          onClick={handleReconnect}
          title='Reconnect to task stream'
          bg='rgba(0, 0, 0, 0.3)'
          color={connectionStatus === ConnectionStatus.ERROR ? '#ef5350' : 'brand.neonBlue'}
          border='1px solid'
          borderColor={connectionStatus === ConnectionStatus.ERROR ? '#ef5350' : 'brand.neonBlue'}
          fontSize={['xs', 'sm']}
          _hover={{
            bg:
              connectionStatus === ConnectionStatus.ERROR
                ? 'rgba(239, 83, 80, 0.2)'
                : 'rgba(0, 204, 255, 0.2)',
            boxShadow:
              connectionStatus === ConnectionStatus.ERROR
                ? '0 0 8px rgba(239, 83, 80, 0.5)'
                : '0 0 8px rgba(0, 204, 255, 0.5)',
          }}
          _active={{
            transform: 'translateY(1px)',
          }}
          transition='all 0.2s ease'
        >
          Reconnect
        </Button>
      )}
    </Flex>
  );
};

export default ConnectionStatusIndicator;
