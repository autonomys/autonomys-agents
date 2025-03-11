import React from 'react';
import { Button, Box } from '@chakra-ui/react';
import { chatButtonStyles } from '../styles/ChatStyles';

interface ChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Button
      {...chatButtonStyles}
      onClick={onClick}
      disabled={disabled}
      aria-label='Chat with namespace'
    >
      <Box as='span' fontSize='14px' lineHeight='1' transform='translateY(1px)'>
        💬
      </Box>
      <Box
        position='absolute'
        top='0'
        left='0'
        right='0'
        bottom='0'
        pointerEvents='none'
        opacity='0.3'
        zIndex='-1'
        bgGradient='radial(circle, rgba(0, 204, 255, 0.2) 0%, transparent 70%)'
        animation='pulseEffect 2s infinite ease-in-out'
      />
    </Button>
  );
};
