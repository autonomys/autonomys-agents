import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Flex, Button } from '@chakra-ui/react';
import { OutputLogProps } from '../../types/types';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useLogMessages } from '../../hooks/useLogMessages';
import NamespaceTabs from '../NamespaceTabs';
import LogMessageList from './LogMessageList';
import { LogSearch } from './components';
import {
  outputLogFlexContainer,
  scrollToBottomButton,
  customOutputLogContainer,
  resizableDefaultSize,
  resizableEnableProps,
} from './styles/LogStyles';
import { Resizable } from 're-resizable';
const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [size, setSize] = useState({ height: window.innerHeight - 185 });
  const { namespaces, activeNamespace, subscribedNamespaces, changeNamespace, refreshNamespaces } =
    useNamespaces();

  const {
    namespaceCount,
    clearLogs,
    getFilteredMessages,
    cleanUp,
    scrollToBottom,
    isAutoScrollEnabled,
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
  } = useLogMessages();

  // Handle keyboard shortcut for search (Ctrl+F)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsSearchVisible(true);
    }
  }, []);

  // Add global keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      cleanUp(subscribedNamespaces);
    };
  }, [cleanUp, subscribedNamespaces]);

  const handleNamespaceChange = (namespace: string) => {
    changeNamespace(namespace);
    if (searchTerm) {
      searchInNamespace(namespace);
    }
  };

  const handleClearLogs = () => {
    clearLogs(activeNamespace);
  };

  const handleCloseSearch = () => {
    handleSearchChange('');
    setIsSearchVisible(false);
  };

  const handleShowSearch = () => {
    setIsSearchVisible(true);
  };

  const handleToggleDebugLogs = () => {
    setShowDebugLogs(prev => !prev);
    // Re-run search to update results based on debug visibility
    if (searchTerm) {
      searchInNamespace(activeNamespace);
    }
  };

  const filteredMessages = getFilteredMessages(activeNamespace);

  return (
    <Box {...customOutputLogContainer} className='right-panel'>
      {/* Search overlay (visible when triggered) */}
      <LogSearch
        activeNamespace={activeNamespace}
        searchTerm={searchTerm}
        searchResults={searchResults}
        currentSearchIndex={currentSearchIndex}
        onSearchChange={handleSearchChange}
        onSearch={searchInNamespace}
        onNextResult={goToNextSearchResult}
        onPrevResult={goToPrevSearchResult}
        isVisible={isSearchVisible}
        onClose={handleCloseSearch}
      />

      <Resizable
        defaultSize={resizableDefaultSize}
        size={{
          width: '100%',
          height: size.height,
        }}
        minHeight={500}
        maxHeight={1000}
        onResizeStop={(e, direction, ref, d) => {
          setSize(prevSize => ({
            height: prevSize.height + d.height,
          }));
        }}
        enable={resizableEnableProps}
      >
        <Flex ref={containerRef} {...outputLogFlexContainer}>
          {/* Use headerRef to dynamically measure the header height */}
          <Box ref={headerRef} width='100%'>
            <NamespaceTabs
              namespaces={namespaces}
              activeNamespace={activeNamespace}
              namespaceCount={namespaceCount}
              onNamespaceChange={handleNamespaceChange}
              onRefreshNamespaces={refreshNamespaces}
              onClearLogs={handleClearLogs}
              onShowSearch={handleShowSearch}
              showDebugLogs={showDebugLogs}
              onToggleDebugLogs={handleToggleDebugLogs}
            />
          </Box>

          <LogMessageList
            filteredMessages={filteredMessages}
            legacyMessages={messages}
            setLogRef={() => {}}
            searchTerm={searchTerm}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            showDebugLogs={showDebugLogs}
          />

          {!isAutoScrollEnabled && filteredMessages.length > 0 && (
            <Button
              {...scrollToBottomButton(isScrolling)}
              onClick={scrollToBottom}
              title='Scroll to bottom'
              aria-label='Scroll to bottom'
            >
              ↓
            </Button>
          )}
        </Flex>
      </Resizable>
    </Box>
  );
};

export default OutputLog;
