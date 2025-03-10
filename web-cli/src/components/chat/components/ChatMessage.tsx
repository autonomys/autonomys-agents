import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { getAvatarStyles, getMessageBubbleStyles } from '../styles/ChatStyles';
import { ChatMessage as ChatMessageType } from '../../../services/ChatService';

interface ChatMessageProps {
  message: ChatMessageType;
  namespace: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, namespace }) => {
  const isUser = message.sender === 'user';

  return (
    <Flex mb={5} flexDirection={isUser ? 'row-reverse' : 'row'} alignItems='flex-start'>
      <Flex {...getAvatarStyles(isUser)}>
        {isUser ? 'U' : namespace.charAt(0).toUpperCase()}
        <Box
          position='absolute'
          top='0'
          left='0'
          right='0'
          bottom='0'
          pointerEvents='none'
          opacity='0.5'
          zIndex='-1'
          bgGradient={
            isUser
              ? 'radial(circle, rgba(255, 0, 204, 0.2) 0%, transparent 70%)'
              : 'radial(circle, rgba(0, 204, 255, 0.2) 0%, transparent 70%)'
          }
        />
      </Flex>
      <Box {...getMessageBubbleStyles(isUser)}>
        <Text
          color='white'
          fontSize='sm'
          fontWeight='medium'
          lineHeight='1.6'
          letterSpacing='0.2px'
          wordBreak='break-word'
        >
          {message.content}
        </Text>
        <Text
          fontSize='xs'
          color={isUser ? 'rgba(255, 0, 204, 0.6)' : 'rgba(0, 204, 255, 0.6)'}
          mt={2}
          textAlign='right'
          fontStyle='italic'
          letterSpacing='0.4px'
        >
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </Box>
    </Flex>
  );
};
