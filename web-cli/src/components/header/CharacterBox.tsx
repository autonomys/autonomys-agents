import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { CharacterBoxProps } from '../../types/types';

const CharacterBox: React.FC<CharacterBoxProps> = ({ character }) => {
  return (
    <Box 
      bg="linear-gradient(135deg, #72003e, #440027)"
      clipPath="polygon(0 0, 100% 0, 95% 100%, 0% 100%)"
      position="relative"
      overflow="hidden"
      p="3"
      height="94px"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Text color="brand.neonPink" textTransform="uppercase" fontSize="sm" mb="2" textShadow="0 0 5px rgba(255, 0, 204, 0.5)">
        Character
      </Text>
      <Box 
        bg="rgba(0, 0, 0, 0.3)"
        borderRadius="3px"
        p="2"
        fontFamily="mono"
        letterSpacing="1px"
        position="relative"
        overflow="hidden"
        borderLeft="2px solid"
        borderColor="brand.neonGreen"
      >
        <Text as="span" color="brand.neonGreen" fontWeight="bold" mr="2">&gt;</Text>
        {character}
        <Text as="span" color="brand.neonGreen" fontWeight="bold" animation="blink 1s step-end infinite" display="inline-block">_</Text>
      </Box>
    </Box>
  );
};

export default CharacterBox;
