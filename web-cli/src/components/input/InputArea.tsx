import React, { KeyboardEvent, useState, useEffect, useRef } from 'react';
import { Box, Heading, Textarea, Button, Text, Flex } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import StatusBox from '../status/StatusBox';
import { InputBoxProps } from '../../types/types';

const InputArea: React.FC<InputBoxProps> = ({
  value,
  handleInputChange,
  handleInputSubmit,
  currentTask,
  error,
}) => {
  const [size, setSize] = useState({ height: 240 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  const getStatusText = () => {
    if (currentTask) {
      const taskStatus = currentTask.status || 'processing';
      const formattedStatus = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1);
      return `${formattedStatus}: ${currentTask.description}`;
    } else if (error) {
      return `Error: ${error}`;
    } else {
      return 'Ready';
    }
  };

  // Adjust textarea height when resizable container changes
  useEffect(() => {
    if (textareaRef.current) {
      const paddingOffset = 120; // Account for padding, headers, other elements
      const newHeight = Math.max(size.height - paddingOffset, 60); // Ensure minimum textarea height
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [size.height]);

  return (
    <Flex direction="column" gap="4" w="100%" h="100%">
      <StatusBox status={getStatusText()} />
      <Resizable
        defaultSize={{
          width: '100%',
          height: 240
        }}
        size={{ 
          width: '100%', 
          height: size.height 
        }}
        minHeight={150}
        maxHeight={500}
        onResizeStop={(e, direction, ref, d) => {
          setSize(prevSize => ({ 
            height: prevSize.height + d.height 
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
          topLeft: false
        }}
        handleStyles={{
          bottom: {
            height: '8px',
            borderRadius: '0 0 6px 6px',
            backgroundColor: 'transparent',
            backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 255, 153, 0.4), transparent)',
            bottom: '0px',
            cursor: 'row-resize'
          }
        }}
        handleComponent={{
          bottom: (
            <Box 
              width="100%" 
              height="8px" 
              position="absolute" 
              bottom="0" 
              cursor="row-resize"
              borderRadius="0 0 6px 6px"
              _hover={{
                backgroundImage: 'linear-gradient(to right, transparent, rgba(0, 255, 153, 0.8), transparent)',
                opacity: 0.7
              }}
            />
          )
        }}
      >
        <Box 
          p={4} 
          bg="rgba(26, 26, 46, 0.8)" 
          borderRadius="md" 
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
          backdropFilter="blur(8px)"
          border="1px solid"
          borderColor="gray.700"
          position="relative"
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgGradient: 'linear(to-r, transparent, brand.neonGreen, transparent)',
          }}
        >
          <Heading 
            as="h3" 
            size="md" 
            mb={3} 
            color="brand.neonGreen" 
            textShadow="0 0 5px rgba(0, 255, 153, 0.5)"
            fontSize={["md", "lg", "xl"]}
          >
            Input
          </Heading>
          
          <Flex direction="column" flex="1">
            <Flex mb={2} flex="1" gap={3}>
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your message here..."
                bg="rgba(0, 0, 0, 0.3)"
                color="white"
                border="1px solid"
                borderColor="gray.600"
                _hover={{ 
                  borderColor: "brand.neonBlue",
                  boxShadow: "0 0 5px rgba(0, 204, 255, 0.3)"
                }}
                _focus={{ 
                  borderColor: "brand.neonGreen", 
                  boxShadow: "0 0 10px rgba(0, 255, 153, 0.3)",
                  outline: "none"
                }}
                _placeholder={{
                  color: "whiteAlpha.500",
                  fontSize: ["sm", "md"]
                }}
                resize="none"
                flex="1"
                h="auto"
                overflowY="auto"
                p={3}
                fontSize={["sm", "md"]}
                transition="all 0.2s ease"
                css={{
                  "&::-webkit-scrollbar": {
                    width: "8px",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(0, 0, 0, 0.1)",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(0, 255, 153, 0.3)",
                    borderRadius: "4px",
                  }
                }}
              />

              <Button
                onClick={handleInputSubmit}
                bg="rgba(0, 0, 0, 0.5)"
                color="brand.neonGreen"
                border="1px solid"
                borderColor="brand.neonGreen"
                alignSelf="stretch"
                px={4}
                fontSize={["sm", "md"]}
                fontWeight="medium"
                _hover={{ 
                  bg: "rgba(0, 255, 153, 0.2)", 
                  boxShadow: "0 0 15px rgba(0, 255, 153, 0.5)"
                }}
                _active={{
                  bg: "rgba(0, 255, 153, 0.3)",
                  transform: "translateY(1px)"
                }}
                transition="all 0.2s ease"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  bg: "rgba(0, 255, 153, 0.7)",
                }}
              >
                Send
              </Button>
            </Flex>

            <Text 
              fontSize={["xs", "sm"]}
              color="whiteAlpha.600"
              textAlign="right"
              mt={1}
              fontStyle="italic"
            >
              Press Enter to send, Shift+Enter for new line
            </Text>
          </Flex>
        </Box>
      </Resizable>
    </Flex>
  );
};

export default InputArea;
