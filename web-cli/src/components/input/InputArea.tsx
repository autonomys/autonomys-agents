import React, { KeyboardEvent, useState, useEffect, useRef } from 'react';
import { Box, Textarea, Button, Text, Flex, Heading } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { InputBoxProps } from '../../types/types';
import {
  containerFlexStyles,
  resizableDefaultSize,
  resizableEnableProps,
  containerBoxStyles,
  contentFlexStyles,
  inputAreaFlexStyles,
  textareaStyles,
  textareaScrollbarStyles,
  sendButtonStyles,
  sendButtonFlexStyles,
  sendButtonTextStyles,
  headingStyles,
} from './styles/InputStyles';

const InputArea: React.FC<InputBoxProps> = ({ value, handleInputChange, handleInputSubmit }) => {
  const [size, setSize] = useState({ height: 200 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  // Adjust textarea height when resizable container changes
  useEffect(() => {
    if (textareaRef.current) {
      const paddingOffset = 80; // Account for padding, headers, other elements
      const newHeight = Math.max(size.height - paddingOffset, 60); // Ensure minimum textarea height
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [size.height]);

  return (
    <Flex {...containerFlexStyles}>
      <Resizable
        defaultSize={resizableDefaultSize}
        size={{
          width: '100%',
          height: size.height,
        }}
        minHeight={150}
        maxHeight={500}
        onResizeStop={(e, direction, ref, d) => {
          setSize(prevSize => ({
            height: prevSize.height + d.height,
          }));
        }}
        enable={resizableEnableProps}
      >
        <Box {...containerBoxStyles}>
          <Heading {...headingStyles}>Input</Heading>

          <Flex {...contentFlexStyles}>
            <Flex {...inputAreaFlexStyles}>
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Enter your message here...'
                {...textareaStyles}
                css={textareaScrollbarStyles}
              />

              <Button onClick={handleInputSubmit} {...sendButtonStyles} className='send-button'>
                <Flex {...sendButtonFlexStyles}>
                  <Text>Send</Text>
                  <Text {...sendButtonTextStyles} style={{ transform: 'rotate(-45deg)' }}>
                    ➚
                  </Text>
                </Flex>
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Resizable>
    </Flex>
  );
};

export default InputArea;
