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
  outputLogFlexContainer,
  outputLogResizableHandleStyles,
  outputLogResizableHandleBox,
  outputLogScrollBox,
  scrollToBottomButton,
  customOutputLogContainer,
} from './styles/LogStyles';



const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  // Using vh units for consistency across browsers instead of window.innerHeight
  const initialHeight = typeof window !== 'undefined' ? window.innerHeight  : 0;
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

  const handleResize = (e: any, direction: any, ref: any, d: any) => {
    // Only update the size if not collapsed, or if expanding from collapsed state
    if (!isCollapsed || (d.height > 0 && size.height <= headerHeight)) {
      // If we're expanding from collapsed state, toggle the collapsed state
      if (isCollapsed && d.height > 0) {
        setIsCollapsed(false);
      }
      
      setSize(prevSize => ({
        height: prevSize.height + d.height,
      }));
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
    <Box {...customOutputLogContainer} className="right-panel">
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
          height: initialHeight,
        }}
        size={{
          width: '100%',
          height: size.height,
        }}
        minHeight={headerHeight}
        onResizeStop={handleResize}
        onResize={(e, direction, ref, d) => {
          // Handle resize in real-time
          if (d.height > 0 && isCollapsed) {
            setIsCollapsed(false);
          }
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
        style={{ borderRadius: 'md', overflow: 'hidden' }}
      >
        <Flex ref={containerRef} {...outputLogFlexContainer}>
          {/* Use headerRef to dynamically measure the header height */}
          <Box ref={headerRef} width="100%">
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

          <Box
            ref={(ref: HTMLDivElement | null) => setLogContainerRef(ref)}
            {...outputLogScrollBox}
            maxHeight={isCollapsed ? "0" : `${size.height - headerHeight}px`}
            height={isCollapsed ? "0" : "auto"}
            overflow={isCollapsed ? "hidden" : "auto"}
            transition="all 0.3s ease"
            opacity={isCollapsed ? 0 : 1}
            visibility={isCollapsed ? "hidden" : "visible"}
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
