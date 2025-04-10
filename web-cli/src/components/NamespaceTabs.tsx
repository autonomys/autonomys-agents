import React, { useState, useEffect } from 'react';
import { Flex, Box, Text, useToken } from '@chakra-ui/react';
import { ChatButton } from './chat/index';
import { useChatContext } from '../context/ChatContext';

// Define types for the neural connection props
interface NeuralConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  delay?: number;
}

// Use plain SVG for the neural connections to avoid TypeScript errors with Box as SVG
const NeuralConnection: React.FC<NeuralConnectionProps> = ({
  x1,
  y1,
  x2,
  y2,
  active,
  delay = 0,
}) => (
  <Box
    position='absolute'
    top='0'
    left='0'
    width='100%'
    height='100%'
    zIndex='1'
    pointerEvents='none'
    opacity={active ? '1' : '0.3'}
    transition='opacity 0.5s'
    dangerouslySetInnerHTML={{
      __html: `
        <svg width="100%" height="100%">
          <defs>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255, 0, 204, 0.2)" />
              <stop offset="50%" stop-color="rgba(255, 0, 204, 1)" />
              <stop offset="100%" stop-color="rgba(255, 0, 204, 0.2)" />
            </linearGradient>
          </defs>
          <line 
            x1="${x1}%" 
            y1="${y1}%" 
            x2="${x2}%" 
            y2="${y2}%" 
            stroke="${active ? 'url(#activeGradient)' : 'rgba(255, 255, 255, 0.2)'}"
            stroke-width="1"
            stroke-dasharray="5,3"
            style="animation: ${active ? `connectionFlow 3s infinite linear` : 'none'}; animation-delay: ${delay}s;"
          />
        </svg>
      `,
    }}
  />
);

interface NamespaceTabsProps {
  namespaces: string[];
  activeNamespace: string;
  namespaceCount: Record<string, number>;
  onNamespaceChange: (namespace: string) => void;
  onRefreshNamespaces: () => void;
  onClearLogs: () => void;
  onShowSearch?: () => void;
  showDebugLogs?: boolean;
  onToggleDebugLogs?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NamespaceTabs: React.FC<NamespaceTabsProps> = ({
  namespaces,
  activeNamespace,
  namespaceCount,
  onNamespaceChange,
  onRefreshNamespaces,
  onClearLogs,
  onShowSearch,
  showDebugLogs = true,
  onToggleDebugLogs,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [neonPink] = useToken('colors', ['brand.neonPink']);
  const [activeIndex, setActiveIndex] = useState(namespaces.indexOf(activeNamespace));
  const [pulsingNode, setPulsingNode] = useState<number | null>(null);
  const [dataProcessing, setDataProcessing] = useState(false);
  const { dispatch } = useChatContext();

  const handleChatClick = (namespace: string) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: namespace });
  };

  useEffect(() => {
    const index = namespaces.indexOf(activeNamespace);
    setActiveIndex(index);
    setDataProcessing(true);

    const nodesToPulse = [index];

    for (let i = 0; i < 2; i++) {
      const randomNode = Math.floor(Math.random() * namespaces.length);
      if (!nodesToPulse.includes(randomNode)) {
        nodesToPulse.push(randomNode);
      }
    }

    nodesToPulse.forEach((node, i) => {
      setTimeout(() => {
        setPulsingNode(node);
        setTimeout(() => setPulsingNode(null), 800);
      }, i * 500);
    });

    setTimeout(() => setDataProcessing(false), 1500);
  }, [activeNamespace, namespaces]);

  return (
    <Box
      position='relative'
      overflow='hidden'
      borderBottom='1px solid rgba(30, 30, 50, 0.5)'
      bg='linear-gradient(180deg, rgba(20, 20, 35, 0.95) 0%, rgba(15, 15, 25, 0.9) 100%)'
      backdropFilter='blur(8px)'
      boxShadow='0 5px 15px -5px rgba(0, 0, 0, 0.5)'
    >
      {/* Neural Network Visualization Layer */}
      <Box
        position='absolute'
        top='0'
        left='0'
        right='0'
        bottom='0'
        opacity='0.1'
        backgroundImage='linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)'
        backgroundSize='30px 30px'
      />

      {/* Create neural connections between tabs */}
      {namespaces.map((_, i) => {
        // Only create connections for tabs near each other
        if (i < namespaces.length - 1) {
          const isActiveConnection = activeIndex === i || activeIndex === i + 1;
          return (
            <NeuralConnection
              key={`connection-${i}`}
              x1={Number((i + 0.5) * (100 / namespaces.length))}
              y1={50}
              x2={Number((i + 1.5) * (100 / namespaces.length))}
              y2={50}
              active={isActiveConnection || dataProcessing}
              delay={i * 0.2}
            />
          );
        }
        return null;
      })}

      {/* Processing nodes with data flow effect at top */}
      <Box
        position='absolute'
        top='0'
        left='0'
        right='0'
        height='2px'
        backgroundImage={
          dataProcessing
            ? `linear-gradient(90deg, 
            transparent, 
            ${neonPink}80, 
            transparent
          )`
            : 'none'
        }
        backgroundSize='200% 100%'
        animation={dataProcessing ? 'shimmer 2s infinite linear' : 'none'}
        opacity={dataProcessing ? '1' : '0'}
        transition='opacity 0.3s'
      />

      {/* Main Tab Container */}
      <Flex
        position='relative'
        flexWrap='nowrap'
        overflowX='auto'
        py={3}
        px={4}
        justifyContent='flex-start'
        alignItems='center'
        css={{
          '&::-webkit-scrollbar': {
            height: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 0, 204, 0.3)',
            borderRadius: '4px',
          },
        }}
      >
        {namespaces.map((namespace, index) => {
          const isActive = activeNamespace === namespace;
          const count = namespaceCount[namespace] || 0;
          const isPulsing = pulsingNode === index;

          return (
            <Flex
              key={namespace}
              direction='column'
              align='center'
              position='relative'
              minW='100px'
              mx={2}
              onClick={() => onNamespaceChange(namespace)}
              cursor='pointer'
              transition='all 0.3s'
              transform={isActive ? 'translateY(-2px)' : 'none'}
              _hover={{ transform: 'translateY(-2px)' }}
            >
              {/* Neural Node */}
              <Box
                position='relative'
                width={count > 0 ? '24px' : '14px'}
                height={count > 0 ? '24px' : '14px'}
                borderRadius='50%'
                bg={isActive ? 'brand.neonPink' : 'rgba(255, 255, 255, 0.3)'}
                my={1}
                animation={
                  isPulsing
                    ? 'neuronActivate 0.8s ease-out'
                    : isActive
                      ? 'neuralPulse 2s infinite'
                      : 'none'
                }
                boxShadow={isActive ? `0 0 10px ${neonPink}` : 'none'}
                zIndex={2}
                display='flex'
                alignItems='center'
                justifyContent='center'
              >
                {/* Neuron ripple effect */}
                {isActive && (
                  <Box
                    position='absolute'
                    top='50%'
                    left='50%'
                    transform='translate(-50%, -50%)'
                    width='100%'
                    height='100%'
                    borderRadius='50%'
                    animation='nodeRipple 3s infinite'
                  />
                )}

                {/* Display count inside the node */}
                {count > 0 && (
                  <Text
                    fontSize='m'
                    fontWeight='bold'
                    color={isActive ? 'white' : 'whiteAlpha.900'}
                    lineHeight='1'
                  >
                    {count}
                  </Text>
                )}
              </Box>

              {/* Data Stream */}
              <Box
                width='1px'
                height='12px'
                bg={
                  isActive
                    ? `linear-gradient(to bottom, ${neonPink}, transparent)`
                    : 'rgba(255, 255, 255, 0.2)'
                }
                opacity={isActive ? 1 : 0.5}
              />

              {/* Tab Label */}
              <Box
                bg={isActive ? 'rgba(30, 0, 40, 0.6)' : 'rgba(30, 30, 50, 0.3)'}
                px={3}
                py={1.5}
                borderRadius='md'
                textAlign='center'
                position='relative'
                overflow='hidden'
                boxShadow={isActive ? `0 0 15px rgba(255, 0, 204, 0.3)` : 'none'}
                border='1px solid'
                borderColor={isActive ? 'brand.neonPink' : 'transparent'}
                transition='all 0.3s'
              >
                {/* Data flow effect background */}
                {(isActive || isPulsing) && (
                  <Box
                    position='absolute'
                    top='0'
                    left='0'
                    right='0'
                    bottom='0'
                    bg='linear-gradient(90deg, 
                      rgba(255, 0, 204, 0) 0%, 
                      rgba(255, 0, 204, 0.2) 50%, 
                      rgba(255, 0, 204, 0) 100%)'
                    backgroundSize='200% 100%'
                    animation='dataFlow 3s ease infinite'
                    zIndex='1'
                    pointerEvents='none'
                  />
                )}

                {/* Tab Name */}
                <Text
                  color={isActive ? 'white' : 'whiteAlpha.700'}
                  fontWeight={isActive ? 'bold' : 'medium'}
                  fontSize='xs'
                  textTransform='uppercase'
                  letterSpacing='0.5px'
                  zIndex='2'
                  position='relative'
                  textShadow={isActive ? `0 0 5px ${neonPink}` : 'none'}
                >
                  {namespace}
                </Text>
              </Box>

              {/* Add the chat button below each tab */}
              <ChatButton onClick={() => handleChatClick(namespace)} disabled={false} />
            </Flex>
          );
        })}

        {/* Control Node Group */}
        <Flex ml='auto' align='center' minW='auto'>
          {/* Debug Mode Neural Node */}
          {onToggleDebugLogs && (
            <Box
              onClick={onToggleDebugLogs}
              position='relative'
              cursor='pointer'
              mx={4}
              display='flex'
              flexDirection='column'
              alignItems='center'
              width='50px'
            >
              {/* Neural Node */}
              <Box
                width='30px'
                height='30px'
                borderRadius='50%'
                bg={showDebugLogs ? 'rgba(138, 43, 226, 0.3)' : 'rgba(138, 43, 226, 0.2)'}
                border='1px solid rgba(138, 43, 226, 0.5)'
                display='flex'
                alignItems='center'
                justifyContent='center'
                boxShadow={
                  showDebugLogs
                    ? '0 0 12px rgba(138, 43, 226, 0.5)'
                    : '0 0 8px rgba(138, 43, 226, 0.3)'
                }
                transition='all 0.3s'
                _hover={{
                  bg: 'rgba(138, 43, 226, 0.4)',
                  boxShadow: '0 0 15px rgba(138, 43, 226, 0.6)',
                }}
              >
                <Text
                  fontSize='16px'
                  fontWeight='bold'
                  color='rgba(138, 43, 226, 0.9)'
                  lineHeight='1'
                >
                  {showDebugLogs ? '🛠️' : '🔧'}
                </Text>
              </Box>
              <Text
                fontSize='14px'
                color={showDebugLogs ? 'rgba(138, 43, 226, 0.9)' : 'rgba(138, 43, 226, 0.7)'}
                mt={2}
                fontWeight='medium'
                textAlign='center'
              >
                DEBUG
              </Text>
            </Box>
          )}

          {/* Toggle Collapse/Expand Neural Node */}
          {onToggleCollapse && (
            <Box
              onClick={onToggleCollapse}
              position='relative'
              cursor='pointer'
              mx={4}
              display='flex'
              flexDirection='column'
              alignItems='center'
              width='50px'
            >
              {/* Neural Node */}
              <Box
                width='30px'
                height='30px'
                borderRadius='50%'
                bg='rgba(255, 64, 129, 0.2)'
                border='1px solid rgba(255, 64, 129, 0.5)'
                display='flex'
                alignItems='center'
                justifyContent='center'
                boxShadow='0 0 8px rgba(255, 64, 129, 0.3)'
                transition='all 0.3s'
                _hover={{
                  bg: 'rgba(255, 64, 129, 0.3)',
                  boxShadow: '0 0 15px rgba(255, 64, 129, 0.5)',
                }}
              >
                <Text
                  fontSize='18px'
                  fontWeight='bold'
                  color='rgba(255, 64, 129, 0.9)'
                  lineHeight='1'
                >
                  {isCollapsed ? '↓' : '↑'}
                </Text>
              </Box>
              <Text
                fontSize='14px'
                color='rgba(255, 64, 129, 0.7)'
                mt={2}
                fontWeight='medium'
                textAlign='center'
              >
                {isCollapsed ? 'SHOW' : 'HIDE'}
              </Text>
            </Box>
          )}

          {/* Refresh Neural Node */}
          <Box
            onClick={onRefreshNamespaces}
            position='relative'
            cursor='pointer'
            mx={4}
            display='flex'
            flexDirection='column'
            alignItems='center'
            width='50px'
          >
            {/* Neural Node */}
            <Box
              width='30px'
              height='30px'
              borderRadius='50%'
              bg='rgba(0, 204, 255, 0.2)'
              border='1px solid rgba(0, 204, 255, 0.5)'
              display='flex'
              alignItems='center'
              justifyContent='center'
              boxShadow='0 0 8px rgba(0, 204, 255, 0.3)'
              transition='all 0.3s'
              _hover={{
                bg: 'rgba(0, 204, 255, 0.3)',
                boxShadow: '0 0 15px rgba(0, 204, 255, 0.5)',
              }}
            >
              <Text
                fontWeight='bold'
                color='rgba(0, 204, 255, 0.9)'
                fontSize='18px'
                lineHeight='1'
                style={{ transform: 'rotate(75deg)' }}
              >
                ↻
              </Text>
            </Box>
            <Text
              fontSize='14px'
              color='rgba(0, 204, 255, 0.7)'
              mt={2}
              fontWeight='medium'
              textAlign='center'
            >
              SYNC
            </Text>
          </Box>

          {/* Clear Neural Node */}
          <Box
            onClick={onClearLogs}
            position='relative'
            cursor='pointer'
            mx={4}
            display='flex'
            flexDirection='column'
            alignItems='center'
            width='50px'
          >
            {/* Neural Node */}
            <Box
              width='30px'
              height='30px'
              borderRadius='50%'
              bg='rgba(239, 83, 80, 0.2)'
              border='1px solid rgba(239, 83, 80, 0.5)'
              display='flex'
              alignItems='center'
              justifyContent='center'
              boxShadow='0 0 8px rgba(239, 83, 80, 0.3)'
              transition='all 0.3s'
              _hover={{
                bg: 'rgba(239, 83, 80, 0.3)',
                boxShadow: '0 0 15px rgba(239, 83, 80, 0.5)',
              }}
            >
              <Text fontSize='18px' fontWeight='bold' color='rgba(239, 83, 80, 0.9)' lineHeight='1'>
                ×
              </Text>
            </Box>
            <Text
              fontSize='14px'
              color='rgba(239, 83, 80, 0.7)'
              mt={2}
              fontWeight='medium'
              textAlign='center'
            >
              CLEAR
            </Text>
          </Box>

          {/* Search Neural Node */}
          {onShowSearch && (
            <Box
              onClick={onShowSearch}
              position='relative'
              cursor='pointer'
              mx={4}
              display='flex'
              flexDirection='column'
              alignItems='center'
              width='50px'
            >
              {/* Neural Node */}
              <Box
                width='30px'
                height='30px'
                borderRadius='50%'
                bg='rgba(255, 193, 7, 0.2)'
                border='1px solid rgba(255, 193, 7, 0.5)'
                display='flex'
                alignItems='center'
                justifyContent='center'
                boxShadow='0 0 8px rgba(255, 193, 7, 0.3)'
                transition='all 0.3s'
                _hover={{
                  bg: 'rgba(255, 193, 7, 0.3)',
                  boxShadow: '0 0 15px rgba(255, 193, 7, 0.5)',
                }}
              >
                <Text
                  fontSize='16px'
                  fontWeight='bold'
                  color='rgba(255, 193, 7, 0.9)'
                  lineHeight='1'
                >
                  🔍
                </Text>
              </Box>
              <Text
                fontSize='14px'
                color='rgba(255, 193, 7, 0.7)'
                mt={2}
                fontWeight='medium'
                textAlign='center'
              >
                CTRL+F
              </Text>
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default NamespaceTabs;
