import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { ChatHeader } from './components/ChatHeader';
import { LoadingState } from './components/LoadingState';
import { ChatMessage } from './components/ChatMessage';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatInput } from './components/ChatInput';
import {
  chatContainerStyles,
  messagesAreaStyles,
  dividerStyles,
  resizableHandleStyles,
} from './styles/ChatStyles';
import { useChatMessages } from '../../hooks/useChatMessages';

interface ChatAreaProps {
  namespace: string;
  character: string;
  onClose: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ namespace, character, onClose }) => {
  const [size, setSize] = useState({ height: 500 });

  const { messages, isLoading, isTyping, inputValue, setInputValue, messagesEndRef, sendMessage } =
    useChatMessages(namespace);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Resizable
      defaultSize={{
        width: '100%',
        height: '100%',
      }}
      size={{
        width: '100%',
        height: size.height,
      }}
      minHeight='70vh'
      maxHeight={1000}
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
        bottom: resizableHandleStyles,
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
              backgroundImage:
                'linear-gradient(to right, transparent, rgba(0, 204, 255, 0.8), transparent)',
              opacity: 0.7,
            }}
          />
        ),
      }}
    >
      <Box {...chatContainerStyles} height='100%'>
        <ChatHeader namespace={namespace} character={character} onClose={onClose} />
        <Box {...messagesAreaStyles}>
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} namespace={namespace} />
          ))}

          {isTyping && <TypingIndicator namespace={namespace} />}
          <div ref={messagesEndRef} />
        </Box>

        <Box {...dividerStyles} />

        <ChatInput
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={sendMessage}
          onKeyDown={handleKeyDown}
          isTyping={isTyping}
          isLoading={isLoading}
        />
      </Box>
    </Resizable>
  );
};

export default ChatArea;
