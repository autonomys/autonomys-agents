import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Input, 
  Flex, 
  Text,
  Button,
  Portal
} from '@chakra-ui/react';
import { logSearchOverlay, logSearchInput, logSearchNavButton, logSearchResultCount } from '../styles/LogStyles';

interface LogSearchProps {
  activeNamespace: string;
  searchTerm: string;
  searchResults: number[];
  currentSearchIndex: number;
  onSearchChange: (term: string) => void;
  onSearch: (namespace: string) => void;
  onNextResult: () => void;
  onPrevResult: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const LogSearch: React.FC<LogSearchProps> = ({
  activeNamespace,
  searchTerm,
  searchResults,
  currentSearchIndex,
  onSearchChange,
  onSearch,
  onNextResult,
  onPrevResult,
  isVisible,
  onClose
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when search becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);
  
  // Update local term when external term changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter goes to previous match
        onPrevResult();
      } else {
        // Enter goes to next match
        if (localSearchTerm !== searchTerm) {
          onSearchChange(localSearchTerm);
          onSearch(activeNamespace);
        } else {
          onNextResult();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'F3' || (e.key === 'g' && e.ctrlKey)) {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevResult();
      } else {
        onNextResult();
      }
    }
  };
  
  const clearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  if (!isVisible) return null;

  return (
    <Portal>
      <Flex 
        {...logSearchOverlay}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input with custom icon */}
        <Box position="relative" flex="1">
          {/* Custom search icon */}
          <Box 
            position="absolute" 
            left="10px" 
            top="50%" 
            transform="translateY(-50%)" 
            zIndex="1"
            fontSize="14px"
            color="gray.400"
          >
            🔍
          </Box>
          
          <Input
            {...logSearchInput}
            ref={inputRef}
            placeholder={`Search in ${activeNamespace}...`}
            value={localSearchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            fontFamily="'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace"
            letterSpacing="0.02em"
          />
          
          {localSearchTerm && (
            <Box 
              position="absolute" 
              right="8px" 
              top="50%" 
              transform="translateY(-50%)"
            >
              <Button
                size="xs"
                variant="ghost"
                onClick={clearSearch}
                aria-label="Clear search"
                height="20px"
                minWidth="20px"
                padding="0"
                color="gray.400"
                _hover={{ color: 'white' }}
              >
                ✕
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Result navigation */}
        <Flex align="center" ml={3}>
          {searchResults.length > 0 ? (
            <>
              <Text {...logSearchResultCount}>
                {currentSearchIndex + 1} of {searchResults.length}
              </Text>
              
              <Button
                {...logSearchNavButton}
                aria-label="Previous result"
                onClick={onPrevResult}
                title="Previous match (Shift+Enter)"
              >
                ⬆️
              </Button>
              
              <Button
                {...logSearchNavButton}
                aria-label="Next result" 
                onClick={onNextResult}
                title="Next match (Enter)"
              >
                ⬇️
              </Button>
            </>
          ) : searchTerm ? (
            <Text color="orange.300" fontSize="xs" fontWeight="medium">
              No matches
            </Text>
          ) : null}
          
          {/* Enhanced close button */}
          <Button
            size="sm"
            ml={3}
            aria-label="Close search"
            onClick={onClose}
            title="Close (Esc)"
            bg="rgba(255, 0, 204, 0.15)"
            color="white"
            borderRadius="md"
            border="1px solid"
            borderColor="brand.neonPink"
            boxShadow="0 0 5px rgba(255, 0, 204, 0.3)"
            _hover={{
              bg: "rgba(255, 0, 204, 0.3)",
              boxShadow: "0 0 10px rgba(255, 0, 204, 0.5)",
              transform: "scale(1.05)"
            }}
            _active={{
              bg: "rgba(255, 0, 204, 0.4)",
            }}
            transition="all 0.2s"
          >
            ✕
          </Button>
        </Flex>
      </Flex>
    </Portal>
  );
};

export default LogSearch; 