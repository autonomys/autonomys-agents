import React from 'react';
import { Box, Heading, Text, Flex, Button, Icon } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import { StatusBoxProps } from '../../types/types';
import {
  resizableHandleStyles,
  resizableHandleBoxStyles,
  containerBoxStyles,
  containerBeforeStyles,
  headingStyles,
  statusDotStyles,
  statusContentBoxStyles,
  readyTextStyles,
  statusLabelStyles,
  statusMessageStyles,
  stopButtonStyles,
  stopButtonTextStyles,
  stopButtonAnimationStyles,
  animationStyles
} from './styles/StatusStyles';

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
        bottom: resizableHandleStyles(statusColor),
      }}
      handleComponent={{
        bottom: (
          <Box {...resizableHandleBoxStyles(statusColor)} />
        ),
      }}
    >
      <Box
        {...containerBoxStyles}
        _before={containerBeforeStyles(statusColor)}
      >
        <Heading {...headingStyles}>
          <Box {...statusDotStyles(statusColor)} />
          Status
        </Heading>

        <Box {...statusContentBoxStyles(statusColor, bgColor)}>
          <Flex direction='column'>
            {isReady ? (
              <Text {...readyTextStyles(statusColor)}>
                Ready for input
              </Text>
            ) : (
              <Flex direction='column'>
                <Flex justify='space-between' align='center'>
                  <Text {...statusLabelStyles(statusColor, !!statusMessage)}>
                    {statusLabel}
                  </Text>
                  {isRunning && onStop && (
                    <Button
                      {...stopButtonStyles}
                      onClick={onStop}
                      css={{
                        animation: animationStyles.nodeRipple,
                      }}
                    >
                      <Text {...stopButtonTextStyles}>Stop</Text>
                      <Box {...stopButtonAnimationStyles} />
                    </Button>
                  )}
                </Flex>
                {statusMessage && (
                  <Text {...statusMessageStyles}>
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
