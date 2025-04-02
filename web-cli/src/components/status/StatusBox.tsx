import React from 'react';
import { Box, Heading, Text, Flex, Button, Icon } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { StatusBoxProps } from '../../types/types';

const StatusBox: React.FC<StatusBoxProps> = ({ status, onStop }) => {
  const getStatusColor = () => {
    if (status.startsWith('Running:') || status.startsWith('Processing:')) {
      return 'brand.neonBlue';
    } else if (status === 'Ready') {
      return 'brand.neonGreen';
    } else if (status.startsWith('Error:')) {
      return '#ef5350'; // Red
    } else {
      return 'gray.400';
    }
  };

  const getBgColor = () => {
    if (status.startsWith('Running:') || status.startsWith('Processing:')) {
      return 'rgba(0, 204, 255, 0.1)';
    } else if (status === 'Ready') {
      return 'rgba(0, 255, 153, 0.1)';
    } else if (status.startsWith('Error:')) {
      return 'rgba(239, 83, 80, 0.1)';
    } else {
      return 'rgba(0, 0, 0, 0.2)';
    }
  };

  const getStatusLabel = () => {
    if (status.includes(':')) {
      return status.split(':')[0];
    }
    return status;
  };

  const getStatusMessage = () => {
    if (status.includes(':')) {
      return status.substring(status.indexOf(':') + 1).trim();
    }
    return '';
  };

  // Add StopIcon component
  const StopIcon = (props: any) => (
    <Icon viewBox="0 0 24 24" {...props}>
      <rect x="6" y="6" width="12" height="12" />
    </Icon>
  );

  const isRunning = status.startsWith('Running:') || status.startsWith('Processing:');
  const statusColor = getStatusColor();
  const bgColor = getBgColor();
  const statusLabel = getStatusLabel();
  const statusMessage = getStatusMessage();
  const isReady = status === 'Ready';

  return (
    <Resizable
      defaultSize={{
        width: '100%',
        height: 200,
      }}
      minHeight={150}
      maxHeight={500}
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
          backgroundImage: `linear-gradient(to right, transparent, ${statusColor}40, transparent)`,
          bottom: '0px',
          cursor: 'row-resize',
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
            _hover={{
              backgroundImage: `linear-gradient(to right, transparent, ${statusColor}, transparent)`,
              opacity: 0.7,
            }}
          />
        ),
      }}
    >
      <Box
        p={4}
        bg='rgba(26, 26, 46, 0.8)'
        borderRadius='md'
        boxShadow='0 4px 8px rgba(0, 0, 0, 0.3)'
        backdropFilter='blur(8px)'
        border='1px solid'
        borderColor='gray.700'
        position='relative'
        display='flex'
        flexDirection='column'
        height='100%'
        width='100%'
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgGradient: `linear(to-r, transparent, ${statusColor}, transparent)`,
        }}
      >
        <Heading
          as='h3'
          size='md'
          mb={3}
          color='brand.neonGreen'
          textShadow='0 0 5px rgba(0, 255, 153, 0.5)'
          display='flex'
          alignItems='center'
          gap={2}
          fontSize={['md', 'lg', 'xl']}
        >
          <Box
            as='span'
            w='8px'
            h='8px'
            borderRadius='full'
            bg={statusColor}
            boxShadow={`0 0 8px ${statusColor}`}
            animation='pulse 2s infinite'
          />
          Status
        </Heading>

        <Box
          p={3}
          bg={bgColor}
          borderRadius='md'
          borderLeft='3px solid'
          borderColor={statusColor}
          transition='all 0.2s ease'
          flex='1'
          overflowY='auto'
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: `${statusColor}40`,
              borderRadius: '3px',
            },
          }}
        >
          <Flex direction='column'>
            {isReady ? (
              <Text fontWeight='500' color={statusColor} fontSize={['sm', 'md', 'lg']}>
                Ready for input
              </Text>
            ) : (
              <Flex direction='column'>
                <Flex justify='space-between' align='center'>
                  <Text
                    fontWeight='600'
                    color={statusColor}
                    mb={statusMessage ? 2 : 0}
                    fontSize={['sm', 'md', 'lg']}
                  >
                    {statusLabel}
                  </Text>
                  {isRunning && onStop && (
                    <Button
                      size='sm'
                      colorScheme='red'
                      variant='outline'
                      onClick={onStop}
                      ml='auto'
                      position='relative'
                      borderRadius='md'
                      py={1.5}
                      px={4}
                      bg='rgba(239, 83, 80, 0.05)'
                      color='#ef5350'
                      border='1px solid'
                      borderColor='rgba(239, 83, 80, 0.3)'
                      overflow='hidden'
                      transition='all 0.2s ease'
                      css={{
                        animation: 'nodeRipple 2s infinite',
                      }}
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        bg: 'rgba(239, 83, 80, 0.7)',
                      }}
                      _hover={{
                        bg: 'rgba(239, 83, 80, 0.15)',
                        borderColor: 'rgba(239, 83, 80, 0.8)',
                        boxShadow: '0 0 12px rgba(239, 83, 80, 0.5)',
                        transform: 'translateY(-1px)',
                        animation: 'none',
                      }}
                      _active={{
                        bg: 'rgba(239, 83, 80, 0.25)',
                        transform: 'translateY(1px)',
                      }}
                    >
                      <Text fontSize="md" fontWeight="500">Stop</Text>
                      <Box
                        position='absolute'
                        top='0'
                        left='0'
                        right='0'
                        bottom='0'
                        pointerEvents='none'
                        opacity='0.3'
                        zIndex='-1'
                        bgGradient='linear(to-r, transparent, rgba(239, 83, 80, 0.2), transparent)'
                        animation='scannerEffect 2s infinite linear'
                      />
                    </Button>
                  )}
                </Flex>
                {statusMessage && (
                  <Text
                    fontSize={['sm', 'md']}
                    fontWeight='normal'
                    color='whiteAlpha.800'
                    wordBreak='break-word'
                    whiteSpace='pre-wrap'
                    lineHeight='1.6'
                  >
                    {statusMessage}
                  </Text>
                )}
              </Flex>
            )}
          </Flex>
        </Box>
      </Box>
    </Resizable>
  );
};

export default StatusBox;
