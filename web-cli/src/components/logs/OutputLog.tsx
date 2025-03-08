import React, { useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { OutputLogProps } from '../../types/types';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useLogMessages } from '../../hooks/useLogMessages';
import NamespaceTabs from '../NamespaceTabs';
import LogMessageList from './LogMessageList';

const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  const { namespaces, activeNamespace, subscribedNamespaces, changeNamespace, refreshNamespaces } =
    useNamespaces();

  const { namespaceCount, setLogContainerRef, clearLogs, getFilteredMessages, cleanUp } =
    useLogMessages();

  useEffect(() => {
    return () => {
      cleanUp(subscribedNamespaces);
    };
  }, [cleanUp, subscribedNamespaces]);

  const handleNamespaceChange = (namespace: string) => {
    changeNamespace(namespace);
  };

  const handleClearLogs = () => {
    clearLogs(activeNamespace);
  };

  const filteredMessages = getFilteredMessages(activeNamespace);

  return (
    <Flex 
      direction="column" 
      h="100%" 
      bg="rgba(26, 26, 46, 0.8)"
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
      border="1px solid"
      borderColor="gray.700"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        bgGradient: 'linear(to-r, transparent, brand.neonPink, transparent)',
        zIndex: "1"
      }}
    >
      <NamespaceTabs
        namespaces={namespaces}
        activeNamespace={activeNamespace}
        namespaceCount={namespaceCount}
        onNamespaceChange={handleNamespaceChange}
        onRefreshNamespaces={refreshNamespaces}
        onClearLogs={handleClearLogs}
      />
      <LogMessageList
        filteredMessages={filteredMessages}
        legacyMessages={messages}
        setLogRef={setLogContainerRef}
      />
    </Flex>
  );
};

export default OutputLog;
