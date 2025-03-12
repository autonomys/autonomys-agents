import React, { useState, useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { MetadataValue } from './';
import { 
  metaDataContainer,
  getMetaDataToggleButton,
  metaDataToggleIcon,
  metaDataToggleLabel,
  getMetaDataFieldCount,
  metaDataPreviewText,
  metaDataContentContainer
} from '../styles/LogStyles';

interface MetaDataProps {
  data: Record<string, any>;
  label?: string;
}

export const MetaData: React.FC<MetaDataProps> = ({ data, label = 'Metadata' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMetadata = () => setIsOpen(!isOpen);
  
  // Count of fields in the metadata
  const fieldCount = useMemo(() => {
    return Object.keys(data).length;
  }, [data]);
  
  // Generate a preview of the metadata content
  const getPreviewText = (): string => {
    if (fieldCount === 0) return 'Empty metadata';
    
    const keys = Object.keys(data).slice(0, 3);
    const preview = keys.map(key => {
      const value = data[key];
      if (value === null || value === undefined) {
        return `${key}: ${value}`;
      }
      if (typeof value === 'object') {
        return `${key}: ${Array.isArray(value) ? '[...]' : '{...}'}`;
      }
      if (typeof value === 'string' && value.length > 30) {
        return `${key}: "${value.substring(0, 27)}..."`;
      }
      return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
    }).join(', ');
    
    return keys.length < fieldCount 
      ? `${preview}, ...` 
      : preview;
  };
  
  // Render metadata as structured content
  const renderMetadata = () => {
    if (fieldCount === 0) {
      return <Text color="gray.500" fontStyle="italic" p={2}>No metadata available</Text>;
    }
    
    return Object.entries(data).map(([key, value], index) => (
      <MetadataValue
        key={`${key}-${index}`}
        name={key}
        value={value}
        path={key}
      />
    ));
  };
  
  return (
    <Box {...metaDataContainer}>
      <Flex 
        {...getMetaDataToggleButton(isOpen)}
        onClick={toggleMetadata}
      >
        <Text {...metaDataToggleIcon}>
          {isOpen ? '▼' : '▶'}
        </Text>
        <Text {...metaDataToggleLabel}>
          {label}
        </Text>
        <Text {...getMetaDataFieldCount(isOpen)}>
          ({fieldCount} {fieldCount === 1 ? 'field' : 'fields'})
        </Text>
        
        {!isOpen && fieldCount > 0 && (
          <Text {...metaDataPreviewText}>
            {getPreviewText()}
          </Text>
        )}
      </Flex>
      
      {isOpen && (
        <Box {...metaDataContentContainer}>
          {renderMetadata()}
        </Box>
      )}
    </Box>
  );
}; 