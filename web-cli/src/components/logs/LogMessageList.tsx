import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Metadata } from './components';
import {
  logMessageListContainer,
  logMessageListWelcomeText,
  logMessageListLegacyMessage,
  logMessageListTimestamp,
  logMessageListNamespace,
  getLogMessageListLevel,
  logMessageListMessage,
  getLogMessageListMessageBox,
  searchHighlight,
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

// Helper function to highlight search matches
const highlightSearchMatches = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm || !text) return text;

  // Use a case-insensitive regex for more reliable matching
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <Text as='span' key={i} {...searchHighlight}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
};

export const LogMessageList: React.FC<LogMessageListProps> = ({
  filteredMessages,
  legacyMessages = [],
  setLogRef,
  searchTerm = '',
  currentSearchIndex = -1,
  searchResults = [],
  showDebugLogs = true,
}) => {
  const formattedMessages = filteredMessages.map(
    msg =>
      ({
        id: `${msg.namespace}-${msg.timestamp ?? Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: msg.timestamp ?? new Date().toISOString(),
        namespace: msg.namespace,
        level: msg.level ?? 'info',
        message: msg.message,
        metadata: msg.meta,
        legacy: false,
      }) as LogMessage,
  );

  const legacyFormattedMessages = legacyMessages.map(
    (msg, index) =>
      ({
        id: `legacy-${index}`,
        timestamp: new Date().toISOString(),
        namespace: 'system',
        level: 'info',
        message: msg,
        legacy: true,
      }) as LogMessage,
  );

  const allMessages = [...formattedMessages, ...legacyFormattedMessages];

  // We're keeping this in place for legacy messages and making sure our component props work
  // correctly, but the main filtering is now done at the useLogMessages hook level
  const filteredByLevelMessages = showDebugLogs
    ? allMessages
    : allMessages.filter(msg => msg.level?.toLowerCase() !== 'debug');

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
    <Box {...logMessageListContainer} ref={setLogRef}>
      {filteredByLevelMessages.length === 0 && (
        <Text {...logMessageListWelcomeText}>Welcome to Autonomys Agents Web CLI</Text>
      )}

      {filteredByLevelMessages
        .filter(msg => msg.legacy)
        .map((msg, index) => (
          <Box key={`legacy-${index}`} {...logMessageListLegacyMessage} data-log-index={index}>
            {highlightSearchMatches(msg.message, searchTerm)}
          </Box>
        ))}

      {filteredByLevelMessages
        .filter(msg => !msg.legacy)
        .map((msg, index) => {
          const msgColor = getMessageColor(msg.level);
          const isSearchMatch = searchResults.includes(index);
          const isCurrentSearchMatch = searchResults[currentSearchIndex] === index;

          return (
            <Box
              key={`log-${index}`}
              {...getLogMessageListMessageBox(msgColor, isSearchMatch, isCurrentSearchMatch)}
              data-log-index={index}
            >
              <Flex direction='row' wrap='wrap' gap={1} alignItems='baseline'>
                <Text {...logMessageListTimestamp}>
                  [{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}]
                </Text>
                <Text {...logMessageListNamespace}>[{msg.namespace}]</Text>
                <Text {...getLogMessageListLevel(msgColor)}>[{msg.level || 'INFO'}]</Text>
                <Text {...logMessageListMessage}>
                  {searchTerm ? highlightSearchMatches(msg.message, searchTerm) : msg.message}
                </Text>
              </Flex>

              {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                <Metadata data={msg.metadata} />
              )}
            </Box>
          );
        })}
    </Box>
  );
};

export default LogMessageList;
