import React, { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import CharacterBox from './CharacterBox';
import LogoBox from './LogoBox';
import ClockBox from './ClockBox';
import { getCharacterName } from '../../services/CharacterService';

const HeaderArea: React.FC = () => {
  const [characterName, setCharacterName] = useState<string>('');

  useEffect(() => {
    const fetchCharacterName = async () => {
      const name = await getCharacterName();
      setCharacterName(name);
    };
    fetchCharacterName();
  }, []);

  return (
    <Box>
      <Flex
        bg='black'
        borderBottom='3px solid'
        borderColor='brand.neonGreen'
        boxShadow='0 0 15px rgba(0, 255, 153, 0.5)'
        position='relative'
        overflow='hidden'
        alignItems='center'
      >
        <Box width='33.33%'>
          <CharacterBox character={characterName} />
        </Box>

        <Box width='33.33%' bg='linear-gradient(to right, #000000, #1a1a2e, #000000)' zIndex='1'>
          <LogoBox />
        </Box>

        <Box width='33.33%'>
          <ClockBox time={new Date()} />
        </Box>
      </Flex>
    </Box>
  );
};

export default HeaderArea;
