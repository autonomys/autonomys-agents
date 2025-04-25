import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
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
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const isInitialLog =
    filteredMessages.filter(msg => msg.type === 'connection').length === filteredMessages.length;

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

  // Monitor if we're near the bottom and auto-scroll only when needed
  useEffect(() => {
    if (shouldAutoScroll && virtuosoRef.current && filteredMessages.length > 0) {
      // Use window.requestAnimationFrame to ensure DOM is updated before scrolling
      window.requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: filteredByLevelMessages.length - 1,
          behavior: 'auto',
          align: 'end',
        });
      });
    }
  }, [filteredMessages, shouldAutoScroll, filteredByLevelMessages.length]);

  const handleRangeChange = (range: { startIndex: number; endIndex: number }) => {
    if (filteredByLevelMessages && filteredByLevelMessages.length > 0) {
      // Check if we're near the bottom (within approximately 20% of the total items)
      // This provides a more generous threshold for auto-scrolling
      const nearBottomThreshold = Math.min(10, Math.ceil(filteredByLevelMessages.length * 0.2));
      const isNearBottom = filteredByLevelMessages.length - range.endIndex <= nearBottomThreshold;
      setShouldAutoScroll(isNearBottom);
    }
  };

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
    <Box position='relative' height='100%' ref={containerRef} style={{ paddingBottom: '16px' }}>
      <Virtuoso
        ref={virtuosoRef}
        className='log-message-list'
        data={filteredByLevelMessages}
        components={{
          Footer: () => <Box py={2} px={4} position='relative' />,
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
        overscan={1000}
        initialTopMostItemIndex={filteredByLevelMessages.length - 1}
        rangeChanged={handleRangeChange}
        followOutput={shouldAutoScroll ? 'smooth' : false}
      />
    </Box>
  );
};

export default LogMessageList;
