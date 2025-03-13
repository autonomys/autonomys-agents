import React, { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import {
  objectNodeContainer,
  getObjectNodeHeader,
  objectNodeToggleButton,
  getObjectNodeChildrenContainer,
} from '../styles/LogStyles';

import { MetadataValue } from './';

interface ObjectNodeProps {
  name: string;
  value: any;
  path?: string;
  depth?: number;
  fontSize?: number;
}

export const ObjectNode: React.FC<ObjectNodeProps> = ({
  name,
  value,
  path = '',
  depth = 0,
  fontSize,
}) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const newPath = path ? `${path}.${name}` : name;
  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((item, i) => [i, item]) : Object.entries(value);

  const getIcon = () => {
    return isArray ? '[]' : '{}';
  };

  return (
    <Box {...objectNodeContainer}>
      <Flex {...getObjectNodeHeader(depth)}>
        <Button size='xs' onClick={() => setIsOpen(!isOpen)} {...objectNodeToggleButton}>
          {isOpen ? '▼' : '▶'}
        </Button>

        <Text
          fontWeight='bold'
          color={isArray ? 'brand.neonBlue' : 'cyan.300'}
          mr={1}
          fontSize={fontSize ? `${fontSize}px` : undefined}
        >
          {name}
          {isArray ? ` (${entries.length})` : ''}:
        </Text>

        <Text as='span' fontSize={fontSize ? `${fontSize}px` : 'xs'} color='gray.500'>
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
              fontSize={fontSize}
            />
          ))}

          {entries.length === 0 && (
            <Text
              fontSize={fontSize ? `${fontSize}px` : 'sm'}
              color='gray.500'
              fontStyle='italic'
              ml={4}
            >
              {isArray ? 'Empty array' : 'Empty object'}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};
