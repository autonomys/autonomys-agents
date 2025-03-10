import React from 'react';
import { Button, Spinner, Box, Text } from '@chakra-ui/react';
import { loadOlderButtonStyles } from '../styles/ChatStyles';

interface LoadOlderButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export const LoadOlderButton: React.FC<LoadOlderButtonProps> = ({
  onClick,
  isLoading,
  hasMore,
}) => {
  if (!hasMore) return null;

  return (
    <Button {...loadOlderButtonStyles} onClick={onClick} disabled={isLoading}>
      {isLoading ? (
        <Spinner size='xs' color='brand.neonBlue' mr={2} />
      ) : (
        <Box as='span' mr={2} transform='rotate(-90deg)' fontSize='xs'>
          ↑
        </Box>
      )}
      <Text>{isLoading ? 'Loading...' : 'Load Older'}</Text>
    </Button>
  );
};
