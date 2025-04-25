import React, { KeyboardEvent, useState, useEffect, useRef } from 'react';
import { Box, Heading, Textarea, Button, Text, Flex } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { InputBoxProps } from '../../types/types';
import {
  containerFlexStyles,
  resizableDefaultSize,
  resizableEnableProps,
  containerBoxStyles,
  headingStyles,
  contentFlexStyles,
  inputAreaFlexStyles,
  textareaStyles,
  textareaScrollbarStyles,
  sendButtonStyles,
  sendButtonFlexStyles,
  sendButtonTextStyles,
} from './styles/InputStyles';
import StatusBox from '../status/StatusBox';
import { stopWorkflow } from '../../services/WorkflowService';

const InputArea: React.FC<InputBoxProps> = ({
  value,
  handleInputChange,
  handleInputSubmit,
  currentTask,
  error,
}) => {
  const [size, setSize] = useState({ height: 200 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [stopStatus, setStopStatus] = useState<string | null>(null);

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

  const getStatusText = () => {
    if (stopStatus) {
      return stopStatus;
    }

    if (currentTask) {
      const taskStatus = currentTask.status || 'processing';

      // Check for stopped status (previously finalizing)
      if (taskStatus === 'stopped') {
        return `Stopped: ${currentTask.description}`;
      }
      // Also check for failed tasks with appropriate result message
      else if (
        taskStatus === 'failed' &&
        currentTask.result &&
        currentTask.result.includes('Stopped by user')
      ) {
        return `Stopped: ${currentTask.description}`;
      }

      const formattedStatus = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1);
      return `${formattedStatus}: ${currentTask.description}`;
    } else if (error) {
      return `Error: ${error}`;
    } else {
      return 'Ready';
    }
  };

  const handleStopWorkflow = async () => {
    try {
      // Immediately set to "Stopped" status
      setStopStatus(`Stopped: ${currentTask?.description || ''}`);

      // Send the stop request
      await stopWorkflow();

      // Keep showing the "Stopped" status for a while
      setTimeout(() => {
        setStopStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error stopping workflow:', error);
      setStopStatus('Error: Failed to stop the workflow. Please try again.');

      // Clear the error message after a delay
      setTimeout(() => {
        setStopStatus(null);
      }, 5000);
    }
  };

  return (
    <Flex {...containerFlexStyles}>
      <StatusBox status={getStatusText()} onStop={handleStopWorkflow} />
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
