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
} from './styles/LogStyles';

const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  // Using vh units for consistency across browsers instead of window.innerHeight
  const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const [size, setSize] = useState({ height: initialHeight });
  const [isCollapsed, setIsCollapsed] = useState(false); // Changed to false (expanded by default)
  const [prevHeight, setPrevHeight] = useState(initialHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  // Default header height - will be updated dynamically
  const [headerHeight, setHeaderHeight] = useState(80);

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

  // Measure header height after render to ensure proper collapse height
  useEffect(() => {
    if (headerRef.current) {
      const headerElement = headerRef.current;
      const height = headerElement.offsetHeight;
      // Add a small buffer to ensure full visibility (e.g., 10px)
      setHeaderHeight(height + 10);
    }
  }, [namespaces]); // Re-measure when namespaces change

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

  const toggleCollapse = () => {
    if (isCollapsed) {
      // When expanding, restore previous height
      setSize({ height: prevHeight });
      setIsCollapsed(false);
    } else {
      // When collapsing, store current height and collapse to header height
      setPrevHeight(size.height);
      setSize({ height: headerHeight });
      setIsCollapsed(true);
    }
  };

  // Update height on window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerHeight - 122;
      if (!isCollapsed) {
        setSize({ height: newHeight });
      }
      setPrevHeight(newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

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
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
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
    </Box>
  );
};

export default OutputLog;
