import React, { useState, useMemo } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { MetadataValue } from '.';
import {
  metadataContainer,
  getMetadataToggleButton,
  metadataToggleIcon,
  metadataToggleLabel,
  getMetadataFieldCount,
  metadataPreviewText,
  metadataContentContainer,
  fontSizeControlsContainer,
  fontSizeLabel,
  fontSizeDisplay,
  getFontSizeButton,
} from '../styles/LogStyles';

interface MetadataProps {
  data: Record<string, any>;
  label?: string;
}

export const Metadata: React.FC<MetadataProps> = ({ data, label = 'Metadata' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const toggleMetadata = () => setIsOpen(!isOpen);

  const fieldCount = useMemo(() => {
    return Object.keys(data).length;
  }, [data]);

  const increaseFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontSize(prev => Math.min(prev + 1, 20));
  };

  const decreaseFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontSize(prev => Math.max(prev - 1, 10));
  };

  const getPreviewText = (): string => {
    if (fieldCount === 0) return 'Empty metadata';

    const keys = Object.keys(data).slice(0, 3);
    const preview = keys
      .map(key => {
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
      })
      .join(', ');

    return keys.length < fieldCount ? `${preview}, ...` : preview;
  };

  const renderMetadata = () => {
    if (fieldCount === 0) {
      return (
        <Text color='gray.500' fontStyle='italic' p={2}>
          No metadata available
        </Text>
      );
    }

    return Object.entries(data).map(([key, value], index) => (
      <MetadataValue
        key={`${key}-${index}`}
        name={key}
        value={value}
        path={key}
        fontSize={fontSize}
      />
    ));
  };

  return (
    <Box {...metadataContainer}>
      <Flex {...getMetadataToggleButton(isOpen)} onClick={toggleMetadata}>
        <Text {...metadataToggleIcon}>{isOpen ? '▼' : '▶'}</Text>
        <Text {...metadataToggleLabel}>{label}</Text>
        <Text {...getMetadataFieldCount(isOpen)}>
          ({fieldCount} {fieldCount === 1 ? 'field' : 'fields'})
        </Text>

        {!isOpen && fieldCount > 0 && <Text {...metadataPreviewText}>{getPreviewText()}</Text>}

        {isOpen && <Box flex='1' />}

        {isOpen && (
          <Flex {...fontSizeControlsContainer} onClick={e => e.stopPropagation()}>
            <Text {...fontSizeLabel}>TEXT_SIZE</Text>

            <Button {...getFontSizeButton(false)} onClick={decreaseFontSize}>
              -
            </Button>

            <Text {...fontSizeDisplay}>{fontSize}</Text>

            <Button {...getFontSizeButton(true)} onClick={increaseFontSize}>
              +
            </Button>
          </Flex>
        )}
      </Flex>

      {isOpen && <Box {...metadataContentContainer}>{renderMetadata()}</Box>}
    </Box>
  );
};
