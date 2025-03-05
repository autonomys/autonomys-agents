import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNamespaces, subscribeToNamespace } from '../services/LogService';

const NAMESPACE_POLL_INTERVAL = 5000;

export const useNamespaces = () => {
  const [namespaces, setNamespaces] = useState<string[]>(['all']);
  const [activeNamespace, setActiveNamespace] = useState<string>('all');
  const subscribedNamespacesRef = useRef<Set<string>>(new Set(['all']));
  const pollingIntervalRef = useRef<number | null>(null);

  const checkForNewNamespaces = useCallback(async () => {
    try {
      const fetchedNamespaces = await fetchNamespaces();
      let hasNewNamespaces = false;

      fetchedNamespaces.forEach(ns => {
        if (!subscribedNamespacesRef.current.has(ns)) {
          hasNewNamespaces = true;
          subscribeToNamespace(ns);
          subscribedNamespacesRef.current.add(ns);
          console.log(`New namespace detected: ${ns}`);
        }
      });

      if (hasNewNamespaces) {
        setNamespaces(['all', ...fetchedNamespaces]);
      }
    } catch (error) {
      console.error('Failed to check for new namespaces:', error);
    }
  }, []);

  useEffect(() => {
    const loadNamespaces = async () => {
      const fetchedNamespaces = await fetchNamespaces();
      setNamespaces(['all', ...fetchedNamespaces]);

      subscribeToNamespace('all');
      subscribedNamespacesRef.current.add('all');

      fetchedNamespaces.forEach(ns => {
        subscribeToNamespace(ns);
        subscribedNamespacesRef.current.add(ns);
      });
    };

    loadNamespaces();

    pollingIntervalRef.current = window.setInterval(() => {
      checkForNewNamespaces();
    }, NAMESPACE_POLL_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [checkForNewNamespaces]);

  const changeNamespace = useCallback((namespace: string) => {
    setActiveNamespace(namespace);

    if (!subscribedNamespacesRef.current.has(namespace)) {
      subscribeToNamespace(namespace);
      subscribedNamespacesRef.current.add(namespace);
    }
  }, []);

  const refreshNamespaces = useCallback(async () => {
    await checkForNewNamespaces();
  }, [checkForNewNamespaces]);

  return {
    namespaces,
    activeNamespace,
    subscribedNamespaces: subscribedNamespacesRef.current,
    changeNamespace,
    refreshNamespaces,
  };
};
