import React, { useRef } from 'react';
import { Box, Flex, Text, Input, Button, Spinner } from '@chakra-ui/react';
import {
  inputContainerStyles,
  inputMessageStyles,
  inputStyles,
  sendButtonStyles,
} from '../styles/ChatStyles';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isTyping: boolean;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  isTyping,
  isLoading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Flex {...inputContainerStyles}>
      <Box {...inputMessageStyles} opacity={value.length > 0 ? 0 : 0.8}>
        Type a message to communicate with the agent
      </Box>
      <Input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder='Type your message...'
        {...inputStyles}
        disabled={isTyping || isLoading}
      />
      <Button
        onClick={onSubmit}
        {...sendButtonStyles}
        disabled={value.trim() === '' || isTyping || isLoading}
      >
        <Flex align='center' justify='center'>
          {isTyping ? (
            <Spinner size='sm' color='brand.neonBlue' mr={2} />
          ) : (
            <>
              <Text fontWeight='medium' mr={1}>
                Send
              </Text>
              <Box
                as='span'
                ml={1}
                animation='floatEffect 2s infinite ease-in-out'
                fontSize='lg'
                fontWeight='bold'
                style={{ transform: 'rotate(-45deg)' }}
              >
                ➚
              </Box>
            </>
          )}
        </Flex>
        <Box
          position='absolute'
          top='0'
          left='0'
          right='0'
          bottom='0'
          pointerEvents='none'
          opacity='0.5'
          zIndex='-1'
          bgGradient='linear(to-r, transparent, rgba(0, 204, 255, 0.2), transparent)'
          animation={isTyping ? 'none' : 'scannerEffect 2s infinite linear'}
        />
        <Box
          position='absolute'
          top='-1px'
          left='10%'
          right='10%'
          height='1px'
          bgGradient='linear(to-r, transparent, rgba(0, 204, 255, 0.8), transparent)'
          opacity={0.8}
        />
      </Button>
    </Flex>
  );
};
