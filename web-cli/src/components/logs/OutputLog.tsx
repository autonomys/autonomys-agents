import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Flex, Button } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { OutputLogProps } from '../../types/types';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useLogMessages } from '../../hooks/useLogMessages';
import NamespaceTabs from '../NamespaceTabs';
import LogMessageList from './LogMessageList';
import { LogSearch } from './components';
import {
  outputLogContainer,
  outputLogFlexContainer,
  outputLogResizableHandleStyles,
  outputLogResizableHandleBox,
  outputLogScrollBox,
  scrollToBottomButton,
} from './styles/LogStyles';

const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  const [size, setSize] = useState({ height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const { namespaces, activeNamespace, subscribedNamespaces, changeNamespace, refreshNamespaces } =
    useNamespaces();

  const {
    namespaceCount,
    setLogContainerRef,
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
    <Box {...outputLogContainer}>
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
        defaultSize={{
          width: '100%',
          height: 400,
        }}
        size={{
          width: '100%',
          height: size.height,
        }}
        minHeight={200}
        maxHeight={800}
        onResizeStop={(e, direction, ref, d) => {
          setSize(prevSize => ({
            height: prevSize.height + d.height,
          }));
        }}
        enable={{
          top: false,
          right: false,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        handleStyles={outputLogResizableHandleStyles}
        handleComponent={{
          bottom: <Box {...outputLogResizableHandleBox} />,
        }}
      >
        <Flex ref={containerRef} {...outputLogFlexContainer}>
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

          <Box
            ref={(ref: HTMLDivElement | null) => setLogContainerRef(ref)}
            {...outputLogScrollBox}
            maxHeight={size.height - 50}
          >
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
          </Box>
        </Flex>
      </Resizable>
    </Box>
  );
};

export default OutputLog;
