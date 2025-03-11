import { useState, useEffect, useCallback, useRef } from 'react';
import { EventSourceMessage } from '../types/types';
import { subscribeToMessages, closeNamespace } from '../services/LogService';

export const useLogMessages = () => {
  const [logMessages, setLogMessages] = useState<EventSourceMessage[]>([]);
  const [namespaceCount, setNamespaceCount] = useState<Record<string, number>>({});
  const logRef = useRef<HTMLDivElement | null>(null);

  const setLogContainerRef = useCallback((ref: HTMLDivElement | null) => {
    logRef.current = ref;
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logMessages]);

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

  return {
    logMessages,
    namespaceCount,
    setLogContainerRef,
    clearLogs,
    getFilteredMessages,
    cleanUp,
  };
};
