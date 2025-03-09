import React, { useEffect, useState, useRef } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { OutputLogProps } from '../../types/types';
import { useNamespaces } from '../../hooks/useNamespaces';
import { useLogMessages } from '../../hooks/useLogMessages';
import NamespaceTabs from '../NamespaceTabs';
import LogMessageList from './LogMessageList';

const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  const [size, setSize] = useState({ height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

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
    <Box
      position='relative'
      zIndex={10}
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    >
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
        handleStyles={{
          bottom: {
            height: '8px',
            borderRadius: '0 0 6px 6px',
            backgroundColor: 'transparent',
            backgroundImage:
              'linear-gradient(to right, transparent, rgba(255, 0, 255, 0.4), transparent)',
            bottom: '0px',
            cursor: 'row-resize',
            zIndex: 11,
          },
        }}
        handleComponent={{
          bottom: (
            <Box
              width='100%'
              height='8px'
              position='absolute'
              bottom='0'
              cursor='row-resize'
              borderRadius='0 0 6px 6px'
              zIndex={11}
              _hover={{
                backgroundImage:
                  'linear-gradient(to right, transparent, rgba(255, 0, 255, 0.8), transparent)',
                opacity: 0.7,
              }}
            />
          ),
        }}
      >
        <Flex
          ref={containerRef}
          direction='column'
          h='100%'
          w='100%'
          bg='rgba(26, 26, 46, 0.8)'
          borderRadius='lg'
          overflow='visible'
          boxShadow='0 8px 32px rgba(0, 0, 0, 0.4)'
          border='1px solid'
          borderColor='gray.700'
          position='relative'
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgGradient: 'linear(to-r, transparent, brand.neonPink, transparent)',
            zIndex: '1',
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

          <Box
            ref={(ref: HTMLDivElement | null) => setLogContainerRef(ref)}
            flex='1'
            overflowY='auto'
            maxHeight={size.height - 50} // Account for NamespaceTabs height
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 0, 255, 0.3)',
                borderRadius: '4px',
              },
            }}
          >
            <LogMessageList
              filteredMessages={filteredMessages}
              legacyMessages={messages}
              setLogRef={() => {}} // This is handled by the parent Box's ref now
            />
          </Box>
        </Flex>
      </Resizable>
    </Box>
  );
};

export default OutputLog;
