import React, { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { MetadataValue } from '.';
import { metadataContainer, metadataContentContainer } from '../styles/LogStyles';

interface MetadataProps {
  data: Record<string, any>;
  label?: string;
}

export const Metadata: React.FC<MetadataProps> = ({ data, label = 'Metadata' }) => {
  const fieldCount = useMemo(() => {
    return Object.keys(data).length;
  }, [data]);

  const renderMetadata = () => {
    if (fieldCount === 0) {
      return (
        <Text color='gray.500' fontStyle='italic' p={2}>
          No metadata available
        </Text>
      );
    }

    return Object.entries(data).map(([key, value], index) => (
      <MetadataValue key={`${key}-${index}`} name={key} value={value} path={key} fontSize={14} />
    ));
  };

  return (
    <Box {...metadataContainer}>
      <Box {...metadataContentContainer}>{renderMetadata()}</Box>
    </Box>
  );
};
