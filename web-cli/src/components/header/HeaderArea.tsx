import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import CharacterBox from './CharacterBox';
import LogoBox from './LogoBox';
import ClockBox from './ClockBox';

const characterName = process.env.REACT_APP_CHARACTER || 'default';

const HeaderArea: React.FC = () => {
  return (
    <Box>
      <Flex 
        bg="black" 
        borderBottom="3px solid" 
        borderColor="brand.neonGreen" 
        boxShadow="0 0 15px rgba(0, 255, 153, 0.5)" 
        position="relative" 
        overflow="hidden"
        alignItems="center"
      >
        <Box width="33.33%">
          <CharacterBox character={characterName} />
        </Box>
        
        <Box 
          width="33.33%" 
          bg="linear-gradient(to right, #000000, #1a1a2e, #000000)"
          zIndex="1"
        >
          <LogoBox />
        </Box>
        
        <Box width="33.33%">
          <ClockBox time={new Date()} />
        </Box>
      </Flex>
    </Box>
  );
};

export default HeaderArea;
