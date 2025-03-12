import React, { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { 
  metadataValueContainer,
  metadataValueIndexLabel,
  metadataValueNameLabel,
  getMetadataValueText,
  getMetadataValueExpandButton,
  metadataValueTypeLabel,
  metadataValueExpandedContent,
  metadataValueExpandedText
} from '../styles/LogStyles';
import { ObjectNode } from './';

interface MetadataValueProps {
  name: string;
  value: any;
  path?: string;
  depth?: number;
  index?: number;
}

export const MetadataValue: React.FC<MetadataValueProps> = ({ 
  name, 
  value, 
  path = '', 
  depth = 0, 
  index 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongString = typeof value === 'string' && value.length > 80;

  if (value !== null && typeof value === 'object') {
    return <ObjectNode name={name} value={value} path={path} depth={depth} />;
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
    if (isLongString && !isExpanded) {
      return `string(${value.length})`;
    }
    return typeof value;
  };
  
  const valueStyle = getValueStyle();
  
  const getDisplayValue = () => {
    if (typeof value !== 'string') {
      return String(value);
    }
    
    if (!isLongString) {
      return `"${value}"`;
    }
    
    if (isExpanded) {
      return "[expanded below]";
    } else {
      return `"${value.substring(0, 77)}..."`;
    }
  };
  
  return (
    <Box {...metadataValueContainer}>
      <Flex alignItems="baseline" flexWrap="wrap">
        {index !== undefined && (
          <Text {...metadataValueIndexLabel}>
            [{index}]
          </Text>
        )}
        <Text {...metadataValueNameLabel}>
          {index === undefined ? `${name}:` : ''}
        </Text>
        <Text
          as="span"
          {...(isExpanded ? { color: 'gray.500', fontStyle: 'italic' } : valueStyle)}
          {...getMetadataValueText(isExpanded, isLongString)}
        >
          {getDisplayValue()}
        </Text>
        
        {isLongString && (
          <Box 
            as="button"
            onClick={() => setIsExpanded(!isExpanded)}
            {...getMetadataValueExpandButton(isExpanded)}
          >
            <Text fontSize="10px" mr={1}>
              {isExpanded ? "▲" : "▼"}
            </Text>
            {isExpanded ? "Collapse" : "Expand"}
          </Box>
        )}
        
        {(!isLongString || !isExpanded) && (
          <Text as="span" {...metadataValueTypeLabel}>
            {getTypeLabel()}
          </Text>
        )}
      </Flex>
      
      {isLongString && isExpanded && (
        <Box {...metadataValueExpandedContent}>
          <Text as="span" {...metadataValueExpandedText}>
            {value}
          </Text>
        </Box>
      )}
    </Box>
  );
}; 