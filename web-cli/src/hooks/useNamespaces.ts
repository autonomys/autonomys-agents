import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNamespaces, subscribeToNamespace } from '../services/LogService';
import { API_BASE_URL, API_TOKEN } from '../services/Api';

export const useNamespaces = () => {
  const [namespaces, setNamespaces] = useState<string[]>(['all']);
  const [activeNamespace, setActiveNamespace] = useState<string>('all');
  const subscribedNamespacesRef = useRef<Set<string>>(new Set(['all']));
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Setup EventSource connection for namespaces
  useEffect(() => {
    const setupEventSource = () => {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      const tokenParam = API_TOKEN ? `?token=${encodeURIComponent(API_TOKEN)}` : '';
      const sseUrl = `${API_BASE_URL}/namespaces/sse${tokenParam}`;
      
      const eventSource = new EventSource(sseUrl);
      
      eventSource.onopen = () => {
        console.log('Connected to namespaces SSE');
        setIsConnected(true);
      };
      
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'namespaces' && Array.isArray(data.data)) {
            console.log('Received namespaces update:', data.data);
            
            // Subscribe to any new namespaces
            data.data.forEach((ns: string) => {
              if (!subscribedNamespacesRef.current.has(ns)) {
                subscribeToNamespace(ns);
                subscribedNamespacesRef.current.add(ns);
                console.log(`SSE: New namespace detected: ${ns}`);
              }
            });
            
            // Update the namespaces state with 'all' at the beginning
            setNamespaces(['all', ...data.data]);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      });
      
      eventSource.onerror = (error) => {
        console.error('Namespaces SSE error:', error);
        setIsConnected(false);
        
        // Close the event source and try to reconnect after a delay
        eventSource.close();
        setTimeout(() => {
          setupEventSource();
        }, 5000);
      };
      
      eventSourceRef.current = eventSource;
    };
    
    setupEventSource();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Initial load of namespaces (fallback if SSE fails)
  useEffect(() => {
    const loadNamespaces = async () => {
      try {
        const fetchedNamespaces = await fetchNamespaces();
        setNamespaces(['all', ...fetchedNamespaces]);

        subscribeToNamespace('all');
        subscribedNamespacesRef.current.add('all');

        fetchedNamespaces.forEach(ns => {
          subscribeToNamespace(ns);
          subscribedNamespacesRef.current.add(ns);
        });
      } catch (error) {
        console.error('Failed to load namespaces:', error);
      }
    };

    // Only load namespaces initially if SSE is not connected
    if (!isConnected) {
      loadNamespaces();
    }
  }, [isConnected]);

  const changeNamespace = useCallback((namespace: string) => {
    setActiveNamespace(namespace);

    if (!subscribedNamespacesRef.current.has(namespace)) {
      subscribeToNamespace(namespace);
      subscribedNamespacesRef.current.add(namespace);
    }
  }, []);

  const refreshNamespaces = useCallback(async () => {
    if (!isConnected) {
      // Fallback to REST API if SSE is not connected
      const fetchedNamespaces = await fetchNamespaces();
      setNamespaces(['all', ...fetchedNamespaces]);
      
      fetchedNamespaces.forEach(ns => {
        if (!subscribedNamespacesRef.current.has(ns)) {
          subscribeToNamespace(ns);
          subscribedNamespacesRef.current.add(ns);
        }
      });
    }
  }, [isConnected]);

  return {
    namespaces,
    activeNamespace,
    subscribedNamespaces: subscribedNamespacesRef.current,
    changeNamespace,
    refreshNamespaces,
    isSSEConnected: isConnected
  };
};
