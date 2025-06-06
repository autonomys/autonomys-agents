import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import {
  metadataValueContainer,
  metadataValueIndexLabel,
  metadataValueNameLabel,
  metadataValueText,
  metadataValueTypeLabel,
  metadataValueExpandedContent,
  metadataValueExpandedText,
} from '../styles/LogStyles';
import { ObjectNode } from './';

interface MetadataValueProps {
  name: string;
  value: any;
  path?: string;
  depth?: number;
  index?: number;
  fontSize?: number;
}

export const MetadataValue: React.FC<MetadataValueProps> = ({
  name,
  value,
  path = '',
  depth = 0,
  index,
  fontSize,
}) => {
  if (value !== null && typeof value === 'object') {
    return <ObjectNode name={name} value={value} path={path} depth={depth} fontSize={fontSize} />;
  }
  const getValueStyle = () => {
    if (value === null || value === undefined) {
      return { color: 'gray.500', fontStyle: 'italic' };
    }
    switch (typeof value) {
      case 'number':
        return { color: 'green.300', fontWeight: 'medium' };
      case 'boolean':
        return { color: 'purple.300', fontWeight: 'medium' };
      case 'string':
        return { color: 'orange.300' };
      default:
        return { color: 'gray.300' };
    }
  };

  const getTypeLabel = () => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    return typeof value;
  };

  const valueStyle = getValueStyle();

  const getDisplayValue = () => {
    if (typeof value !== 'string') {
      return String(value);
    }
    return value;
  };

  return (
    <Box {...metadataValueContainer}>
      <Flex alignItems='baseline' flexWrap='wrap'>
        {index !== undefined && (
          <Text {...metadataValueIndexLabel} fontSize={fontSize ? `${fontSize}px` : undefined}>
            [{index}]
          </Text>
        )}
        <Text {...metadataValueNameLabel} fontSize={fontSize ? `${fontSize}px` : undefined}>
          {index === undefined ? `${name}:` : ''}
        </Text>
        <Text
          as='span'
          {...valueStyle}
          {...metadataValueText}
          fontSize={fontSize ? `${fontSize}px` : undefined}
        >
          {getDisplayValue()}
        </Text>

        <Text
          as='span'
          {...metadataValueTypeLabel}
          fontSize={fontSize ? `${Math.max(10, fontSize - 2)}px` : undefined}
        >
          {getTypeLabel()}
        </Text>
      </Flex>

      <Box {...metadataValueExpandedContent}>
        <Text
          as='span'
          {...metadataValueExpandedText}
          fontSize={fontSize ? `${fontSize}px` : undefined}
        >
          {value}
        </Text>
      </Box>
    </Box>
  );
};
