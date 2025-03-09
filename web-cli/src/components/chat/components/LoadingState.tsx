import React from 'react';
import { Flex, Text, Spinner } from '@chakra-ui/react';
import { loadingContainerStyles } from '../styles/ChatStyles';

export const LoadingState: React.FC = () => {
  return (
    <Flex {...loadingContainerStyles}>
      <Spinner size='md' color='brand.neonBlue' mb={4} />
      <Text>Loading chat history...</Text>
    </Flex>
  );
};
