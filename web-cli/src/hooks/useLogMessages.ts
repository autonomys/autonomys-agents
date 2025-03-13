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
  }, []);

  const getFilteredMessages = useCallback(
    (namespace: string) => {
      return namespace === 'all'
        ? logMessages
        : logMessages.filter(msg => msg.namespace === namespace);
    },
    [logMessages],
  );

  const cleanUp = useCallback((subscribedNamespaces: Set<string>) => {
    subscribedNamespaces.forEach(ns => {
      closeNamespace(ns);
    });
  }, []);

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
  };
};
