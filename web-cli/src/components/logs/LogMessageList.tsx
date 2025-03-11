import React, { useState } from 'react';
import { Box, Text, Flex, Code, Button } from '@chakra-ui/react';
import { LogMessageListProps } from '../../types/types';

// Create a custom MetaData component instead of using Accordion
const MetaData = ({ data }: { data: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box mt='2' ml='5' fontSize={['xs', 'sm']}>
      <Button
        variant='ghost'
        p='1'
        color='brand.neonPink'
        fontStyle='italic'
        _hover={{
          color: 'brand.neonPink',
          bg: 'rgba(255, 0, 204, 0.1)',
          textDecoration: 'underline',
        }}
        onClick={() => setIsOpen(!isOpen)}
        fontWeight='normal'
        height='auto'
        minWidth='auto'
        textAlign='left'
        fontSize={['xs', 'sm']}
        textShadow='0 0 5px rgba(255, 0, 204, 0.5)'
      >
        Meta Data
      </Button>
      {isOpen && (
        <Code
          display='block'
          whiteSpace='pre-wrap'
          maxH='300px'
          overflowY='auto'
          bg='rgba(0, 0, 0, 0.2)'
          p='3'
          borderRadius='md'
          mt='2'
          fontFamily="'Consolas', 'Monaco', monospace"
          border='1px solid'
          borderColor='gray.700'
          color='white'
          fontSize={['xs', 'sm']}
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 0, 204, 0.3)',
              borderRadius: '3px',
            },
          }}
        >
          {JSON.stringify(data, null, 2)}
        </Code>
      )}
    </Box>
  );
};

const LogMessageList: React.FC<LogMessageListProps> = ({
  filteredMessages,
  legacyMessages = [],
  setLogRef,
}) => {
  const getMessageColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'info':
        return 'brand.neonBlue'; // Light blue
      case 'error':
        return '#ef5350'; // Light red
      case 'debug':
        return 'brand.neonGreen'; // Light green
      default:
        return 'brand.neonBlue'; // Default to info color
    }
  };

  return (
    <Box
      flex='1'
      overflowY='auto'
      p={4}
      bg='rgba(20, 20, 30, 0.7)'
      backdropFilter='blur(5px)'
      fontFamily="'Consolas', 'Monaco', monospace"
      color='white'
      whiteSpace='pre-wrap'
      fontSize={['sm', 'md']}
      lineHeight='1.6'
      ref={setLogRef}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
          borderRadius: '4px',
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
      {filteredMessages.length === 0 && legacyMessages.length === 0 && (
        <Text
          color='brand.neonPink'
          fontSize={['md', 'lg', 'xl']}
          fontStyle='italic'
          textAlign='center'
          my={8}
          textShadow='0 0 15px rgba(255, 0, 204, 0.5)'
          fontWeight='medium'
          letterSpacing='wide'
        >
          Welcome to Autonomys Agents Web CLI
        </Text>
      )}

      {legacyMessages.map((message, index) => (
        <Box
          key={index}
          mb={3}
          p={3}
          borderRadius='md'
          bg='rgba(0, 0, 0, 0.2)'
          borderLeft='3px solid'
          borderColor='gray.600'
          position='relative'
          transition='all 0.2s ease'
          _hover={{
            bg: 'rgba(0, 0, 0, 0.3)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
          }}
          fontSize={['xs', 'sm']}
        >
          {message}
        </Box>
      ))}

      {filteredMessages.map((msg, index) => {
        const msgColor = getMessageColor(msg.level);

        return (
          <Box
            key={`log-${index}`}
            mb={3}
            p={3}
            borderRadius='md'
            bg='rgba(0, 0, 0, 0.2)'
            borderLeft='3px solid'
            borderColor={msgColor}
            position='relative'
            transition='all 0.2s ease'
            _hover={{
              bg: 'rgba(0, 0, 0, 0.3)',
              boxShadow: `0 0 12px rgba(0, 0, 0, 0.3)`,
            }}
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '3px',
              height: '100%',
              bg: msgColor,
              boxShadow: `0 0 8px ${msgColor}`,
            }}
          >
            <Flex direction='row' wrap='wrap' gap={1} alignItems='baseline'>
              <Text color='gray.400' fontWeight='500' as='span' fontSize={['xs', 'sm']}>
                [{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}]
              </Text>
              <Text color='brand.neonBlue' fontWeight='500' as='span' fontSize={['xs', 'sm']}>
                [{msg.namespace}]
              </Text>
              <Text
                color={msgColor}
                fontWeight='600'
                as='span'
                fontSize={['xs', 'sm']}
                textShadow={`0 0 5px ${msgColor}`}
              >
                [{msg.level || 'INFO'}]
              </Text>
              <Text
                color='white'
                as='span'
                wordBreak='break-word'
                whiteSpace='pre-wrap'
                fontSize={['xs', 'sm']}
                fontWeight='normal'
                lineHeight='1.6'
              >
                {msg.message}
              </Text>
            </Flex>

            {msg.meta && Object.keys(msg.meta).length > 0 && <MetaData data={msg.meta} />}
          </Box>
        );
      })}
    </Box>
  );
};

export default LogMessageList;
