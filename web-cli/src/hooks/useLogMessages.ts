import { useState, useEffect, useCallback, useRef } from 'react';
import { EventSourceMessage } from '../types/types';
import { subscribeToMessages, closeNamespace } from '../services/LogService';

export const useLogMessages = () => {
  const [logMessages, setLogMessages] = useState<EventSourceMessage[]>([]);
  const [namespaceCount, setNamespaceCount] = useState<Record<string, number>>({});
  const logRef = useRef<HTMLDivElement | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isNearBottomRef = useRef<boolean>(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showDebugLogs, setShowDebugLogs] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  const setLogContainerRef = useCallback((ref: HTMLDivElement | null) => {
    logRef.current = ref;

    if (ref) {
      const handleScroll = () => {
        if (!ref) return;

        const isNearBottom = ref.scrollHeight - ref.clientHeight - ref.scrollTop < 50;
        isNearBottomRef.current = isNearBottom;

        setShouldAutoScroll(isNearBottom);
      };

      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (logRef.current && shouldAutoScroll) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logMessages, shouldAutoScroll]);

  const handleLogMessage = useCallback((message: EventSourceMessage) => {
    setLogMessages(prev => [...prev, message]);

    setNamespaceCount(prev => {
      const newCount = { ...prev };
      newCount[message.namespace] = (newCount[message.namespace] || 0) + 1;
      newCount['all'] = (newCount['all'] || 0) + 1;
      return newCount;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(handleLogMessage);

    return () => {
      unsubscribe();
    };
  }, [handleLogMessage]);

  const clearLogs = useCallback((namespace: string) => {
    if (namespace === 'all') {
      setLogMessages([]);
      setNamespaceCount({});
    } else {
      setLogMessages(prev => prev.filter(msg => msg.namespace !== namespace));

      setNamespaceCount(prev => {
        const newCount = { ...prev };
        const currentCount = newCount[namespace] || 0;
        newCount[namespace] = 0;
        newCount['all'] = Math.max(0, (newCount['all'] || 0) - currentCount);
        return newCount;
      });
    }
    setShouldAutoScroll(true);
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, []);

  const getFilteredMessages = useCallback(
    (namespace: string) => {
      const namespaceFiltered =
        namespace === 'all' ? logMessages : logMessages.filter(msg => msg.namespace === namespace);

      return showDebugLogs
        ? namespaceFiltered
        : namespaceFiltered.filter(msg => msg.level?.toLowerCase() !== 'debug');
    },
    [logMessages, showDebugLogs],
  );

  const cleanUp = useCallback((subscribedNamespaces: Set<string>) => {
    subscribedNamespaces.forEach(ns => {
      closeNamespace(ns);
    });
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentSearchIndex(-1);

    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchResults([]);
  }, []);

  const searchInNamespace = useCallback(
    (namespace: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return [];
      }

      // Get messages filtered by namespace and debug status
      const filteredMessages = getFilteredMessages(namespace);

      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearchTerm, 'i');

      const results = filteredMessages
        .map((msg, index) => {
          const messageContent = msg.message || '';
          const metaString = msg.meta ? JSON.stringify(msg.meta) : '';

          if (searchRegex.test(messageContent) || searchRegex.test(metaString)) {
            return index;
          }
          return -1;
        })
        .filter(index => index !== -1);

      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);

      return results;
    },
    [searchTerm, getFilteredMessages],
  );

  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const activeNamespace =
        Object.keys(namespaceCount).find(ns => namespaceCount[ns] > 0) || 'all';

      searchInNamespace(activeNamespace);
    }
  }, [showDebugLogs, searchTerm, searchInNamespace, namespaceCount]);

  const goToNextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);

    if (logRef.current && searchResults[nextIndex] !== undefined) {
      const messageElements = logRef.current.querySelectorAll('[data-log-index]');
      const targetElement = messageElements[searchResults[nextIndex]];

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResults, currentSearchIndex]);

  const goToPrevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;

    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);

    if (logRef.current && searchResults[prevIndex] !== undefined) {
      const messageElements = logRef.current.querySelectorAll('[data-log-index]');
      const targetElement = messageElements[searchResults[prevIndex]];

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResults, currentSearchIndex]);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      setIsScrolling(true);

      logRef.current.scrollTo({
        top: logRef.current.scrollHeight,
        behavior: 'smooth',
      });

      setTimeout(() => {
        setIsScrolling(false);
        setShouldAutoScroll(true);
      }, 500);
    }
  }, []);

  return {
    logMessages,
    namespaceCount,
    setLogContainerRef,
    clearLogs,
    getFilteredMessages,
    cleanUp,
    scrollToBottom,
    isAutoScrollEnabled: shouldAutoScroll,
    isScrolling,
    searchTerm,
    searchResults,
    currentSearchIndex,
    handleSearchChange,
    searchInNamespace,
    goToNextSearchResult,
    goToPrevSearchResult,
    showDebugLogs,
    setShowDebugLogs,
  };
};
