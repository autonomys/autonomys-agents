import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { MetaData } from './components';
import { 
  logMessageListContainer,
  logMessageListWelcomeText,
  logMessageListLegacyMessage,
  logMessageListTimestamp,
  logMessageListNamespace,
  getLogMessageListLevel,
  logMessageListMessage,
  getLogMessageListMessageBox
} from './styles/LogStyles';
import { LogMessageListProps } from '../../types/types';

interface LogMessage {
  id: string;
  timestamp: string;
  namespace: string;
  level: 'info' | 'error' | 'debug' | string;
  message: string;
  metadata?: Record<string, any>;
  legacy?: boolean;
}

export const LogMessageList: React.FC<LogMessageListProps> = ({ 
  filteredMessages, 
  legacyMessages = [],
  setLogRef
}) => {

  const formattedMessages = filteredMessages.map(msg => ({
    id: `${msg.namespace}-${msg.timestamp ?? Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: msg.timestamp ?? new Date().toISOString(),
    namespace: msg.namespace,
    level: msg.level ?? 'info',
    message: msg.message,
    metadata: msg.meta,
    legacy: false
  } as LogMessage));

  const legacyFormattedMessages = legacyMessages.map((msg, index) => ({
    id: `legacy-${index}`,
    timestamp: new Date().toISOString(),
    namespace: 'system',
    level: 'info',
    message: msg,
    legacy: true
  } as LogMessage));

  const allMessages = [...formattedMessages, ...legacyFormattedMessages];
  
  const getMessageColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': 
        return 'red.300';
      case 'debug': 
        return 'gray.400';
      case 'info':
      default: 
        return 'brand.neonBlue';
    }
  };
  
  return (
    <Box
      {...logMessageListContainer}
      ref={setLogRef}
    >
      {allMessages.length === 0 && (
        <Text
          {...logMessageListWelcomeText}
        >
          Welcome to Autonomys Agents Web CLI
        </Text>
      )}
      
      {allMessages.filter(msg => msg.legacy).map((msg, index) => (
        <Box
          key={`legacy-${index}`}
          {...logMessageListLegacyMessage}
        >
          {msg.message}
        </Box>
      ))}
      
      {allMessages.filter(msg => !msg.legacy).map((msg, index) => {
        const msgColor = getMessageColor(msg.level);

        return (
          <Box
            key={`log-${index}`}
            {...getLogMessageListMessageBox(msgColor)}
          >
            <Flex direction='row' wrap='wrap' gap={1} alignItems='baseline'>
              <Text {...logMessageListTimestamp}>
                [{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}]
              </Text>
              <Text {...logMessageListNamespace}>
                [{msg.namespace}]
              </Text>
              <Text
                {...getLogMessageListLevel(msgColor)}
              >
                [{msg.level || 'INFO'}]
              </Text>
              <Text
                {...logMessageListMessage}
              >
                {msg.message}
              </Text>
            </Flex>

            {msg.metadata && Object.keys(msg.metadata).length > 0 && <MetaData data={msg.metadata} />}
          </Box>
        );
      })}
    </Box>
  );
};

export default LogMessageList;
