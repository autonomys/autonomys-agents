import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
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
import { LogMessageListProps, ScheduledTask } from '../../types/types';
import { subscribeToProcessingTasks } from '../../services/TaskStreamService';

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
  const [processingTasks, setProcessingTasks] = useState<ScheduledTask[]>([]);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const isInitialLog =
    filteredMessages.filter(msg => msg.type === 'connection').length === filteredMessages.length;

  // Check if new messages have been added in the last 2 seconds
  useEffect(() => {
    if (filteredMessages.length > 0) {
      const unsubscribeFromProcessingTasks = subscribeToProcessingTasks(updatedTasks => {
        console.log(`Received ${updatedTasks.length} processing tasks from stream`);
        setProcessingTasks(updatedTasks);
      });
      return () => {
        unsubscribeFromProcessingTasks();
      };
    }
  }, [filteredMessages.length]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (virtuosoRef.current && filteredMessages.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: 'LAST',
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [filteredMessages]);

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

  const filteredByLevelMessages = useMemo(() => {
    let allMessages: LogMessage[] = [];

    if (isInitialLog) {
      allMessages = [...formattedMessages, ...legacyFormattedMessages];
    } else {
      allMessages = [...formattedMessages];
    }

    if (showDebugLogs) {
      return allMessages;
    }
    return allMessages.filter(msg => msg.level?.toLowerCase() !== 'debug');
  }, [formattedMessages, legacyFormattedMessages, showDebugLogs, isInitialLog]);

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

  const containerRef = (ref: HTMLDivElement | null) => {
    // Forward the ref to the parent component
    if (setLogRef) {
      setLogRef(ref);
    }
  };

  if (filteredByLevelMessages.length === 0) {
    return (
      <Box {...logMessageListContainer} ref={containerRef}>
        <Text {...logMessageListWelcomeText}>Welcome to the Autonomys Agents Web CLI</Text>
      </Box>
    );
  }

  return (
    <Box position='relative' height='100%' ref={containerRef}>
      <Virtuoso
        ref={virtuosoRef}
        className='log-message-list'
        data={filteredByLevelMessages}
        components={{
          Footer: () => <Box py={4} px={4} position='relative' />,
        }}
        itemContent={(index, msg) => {
          const msgColor = getMessageColor(msg.level);
          const isSearchMatch = searchResults.includes(index);
          const isCurrentSearchMatch = searchResults[currentSearchIndex] === index;

          if (msg.legacy) {
            return (
              <Box key={`legacy-${index}`} {...logMessageListLegacyMessage} data-log-index={index}>
                {highlightSearchMatches(msg.message, searchTerm)}
              </Box>
            );
          }

          return (
            <Box
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
        }}
        followOutput='auto'
        overscan={200}
        initialTopMostItemIndex={filteredByLevelMessages.length - 1}
        alignToBottom
      />

      {processingTasks.length > 0 && (
        <Flex
          position='absolute'
          bottom='20px'
          left='45%'
          backgroundColor='rgba(0,0,0,0.6)'
          padding='8px'
          borderRadius='full'
          alignItems='center'
          boxShadow='0 0 10px rgba(0,0,0,0.3)'
          zIndex={10}
        >
          <Spinner size='sm' color='brand.neonBlue' marginRight='2' />
          <Text fontSize='xs' color='white'>
            Processing...
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default LogMessageList;
