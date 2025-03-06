import React from 'react';
import './styles/NamespaceTabs.css';

interface NamespaceTabsProps {
  namespaces: string[];
  activeNamespace: string;
  namespaceCount: Record<string, number>;
  onNamespaceChange: (namespace: string) => void;
  onRefreshNamespaces: () => void;
  onClearLogs: () => void;
}

const NamespaceTabs: React.FC<NamespaceTabsProps> = ({
  namespaces,
  activeNamespace,
  namespaceCount,
  onNamespaceChange,
  onRefreshNamespaces,
  onClearLogs,
}) => {
  return (
    <div className='namespace-tabs'>
      {namespaces.map(namespace => (
        <button
          key={namespace}
          className={`namespace-tab ${activeNamespace === namespace ? 'active' : ''}`}
          onClick={() => onNamespaceChange(namespace)}
        >
          {namespace}
          {namespaceCount[namespace] > 0 && (
            <span className='namespace-count'>{namespaceCount[namespace]}</span>
          )}
        </button>
      ))}
      <button className='namespace-tab refresh-namespaces' onClick={onRefreshNamespaces}>
        <span className='refresh-icon'>🔄</span>
      </button>
      <button className='namespace-tab clear-logs' onClick={onClearLogs}>
        <span className='clear-icon'>🗑️</span> Clear
      </button>
    </div>
  );
};

export default NamespaceTabs;
