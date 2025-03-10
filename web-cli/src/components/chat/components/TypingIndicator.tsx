import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import {
  getAvatarStyles,
  getMessageBubbleStyles,
  typingIndicatorContainerStyles,
  typingDotsContainerStyles,
  getTypingDotStyles,
} from '../styles/ChatStyles';

interface TypingIndicatorProps {
  namespace: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ namespace }) => {
  return (
    <Flex {...typingIndicatorContainerStyles}>
      <Flex {...getAvatarStyles(false)} zIndex='1'>
        {namespace.charAt(0).toUpperCase()}
        <Box
          position='absolute'
          top='0'
          left='0'
          right='0'
          bottom='0'
          pointerEvents='none'
          opacity='0.5'
          zIndex='-1'
          bgGradient='radial(circle, rgba(0, 204, 255, 0.3) 0%, transparent 70%)'
          animation='pulseEffect 1.5s infinite ease-in-out'
        />
      </Flex>
      <Box {...getMessageBubbleStyles(false)} minHeight='50px' display='flex' alignItems='center'>
        <Flex {...typingDotsContainerStyles}>
          <Box {...getTypingDotStyles('0s')} />
          <Box {...getTypingDotStyles('0.2s')} />
          <Box {...getTypingDotStyles('0.4s')} />
        </Flex>
      </Box>
    </Flex>
  );
};
