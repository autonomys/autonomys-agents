import React from 'react';
import { Box, Flex, Heading, Button } from '@chakra-ui/react';
import {
  headerStyles,
  headingStyles,
  statusDotStyles,
  closeButtonStyles,
} from '../styles/ChatStyles';

interface ChatHeaderProps {
  namespace: string;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ namespace, onClose }) => {
  return (
    <Flex {...headerStyles}>
      <Heading {...headingStyles}>
        <Box {...statusDotStyles} />
        Chat: {namespace}
      </Heading>
      <Button onClick={onClose} {...closeButtonStyles}>
        <Box as='span' fontSize='18px' lineHeight='1' transform='translateY(-1px)'>
          ×
        </Box>
      </Button>
    </Flex>
  );
};
