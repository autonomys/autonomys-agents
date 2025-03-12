import React, { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { 
  objectNodeContainer,
  getObjectNodeHeader,
  objectNodeToggleButton,
  getObjectNodeChildrenContainer
} from '../styles/LogStyles';
// Import MetadataValue from the index file to avoid circular references
import { MetadataValue } from './';

interface ObjectNodeProps {
  name: string;
  value: any;
  path?: string;
  depth?: number;
}

export const ObjectNode: React.FC<ObjectNodeProps> = ({ 
  name, 
  value, 
  path = '', 
  depth = 0 
}) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const newPath = path ? `${path}.${name}` : name;
  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((item, i) => [i, item])
    : Object.entries(value);
  
  // Get the icon for the type (array or object)
  const getIcon = () => {
    return isArray ? '[]' : '{}';
  };
  
  return (
    <Box {...objectNodeContainer}>
      <Flex {...getObjectNodeHeader(depth)}>
        <Button 
          size="xs"
          onClick={() => setIsOpen(!isOpen)}
          {...objectNodeToggleButton}
        >
          {isOpen ? '▼' : '▶'}
        </Button>
        
        <Text fontWeight="bold" color={isArray ? "brand.neonBlue" : "cyan.300"} mr={1}>
          {name}
          {isArray ? ` (${entries.length})` : ''}:
        </Text>
        
        <Text as="span" fontSize="xs" color="gray.500">
          {getIcon()}
        </Text>
      </Flex>
      
      {isOpen && (
        <Box {...getObjectNodeChildrenContainer(isArray)}>
          {entries.map(([key, val], index) => (
            <MetadataValue
              key={index}
              name={`${key}`}
              value={val}
              path={newPath}
              depth={depth + 1}
              index={isArray ? Number(key) : undefined}
            />
          ))}
          
          {entries.length === 0 && (
            <Text fontSize="sm" color="gray.500" fontStyle="italic" ml={4}>
              {isArray ? 'Empty array' : 'Empty object'}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}; 