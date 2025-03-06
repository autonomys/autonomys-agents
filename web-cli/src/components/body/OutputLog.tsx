import React, { useEffect } from 'react';
import { OutputLogProps } from '../../types/types';
import './styles/OutputLog.css';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useLogMessages } from '../../hooks/useLogMessages';
import NamespaceTabs from './NamespaceTabs';
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
    <div className='output-log-container'>
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
    </div>
  );
};

export default OutputLog;
