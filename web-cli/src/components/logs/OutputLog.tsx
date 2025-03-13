import React, { useEffect, useState, useRef } from 'react';
import { Box, Flex, Button } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { OutputLogProps } from '../../types/types';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useLogMessages } from '../../hooks/useLogMessages';
import NamespaceTabs from '../NamespaceTabs';
import LogMessageList from './LogMessageList';
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
  } = useLogMessages();

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
    <Box {...outputLogContainer}>
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
            />

            {/* Scroll to bottom button */}
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
