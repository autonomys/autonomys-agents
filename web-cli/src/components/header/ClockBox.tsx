import React, { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { ClockBoxProps } from '../../types/types';

const ClockBox: React.FC<ClockBoxProps> = ({ time }) => {
  const [currentTime, setCurrentTime] = useState<Date>(time || new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format the date in ISO format (e.g., 2025-03-09T01:32:26.997Z)
  const formatISODateTime = (date: Date) => {
    return date.toISOString();
  };

  return (
    <Box
      bg='linear-gradient(135deg, #003366, #001830)'
      clipPath='polygon(5% 0, 100% 0, 100% 100%, 0% 100%)'
      position='relative'
      overflow='hidden'
      textAlign='right'
      p='3'
      height='94px'
      display='flex'
      flexDirection='column'
      justifyContent='center'
      py='3'
    >
      <Flex direction='column' alignItems='flex-end' width='100%'>
        <Text
          color='brand.neonPink'
          textTransform='uppercase'
          fontSize='lg'
          mb='1.5'
          textAlign='right'
          textShadow='0 0 5px rgba(255, 0, 204, 0.5)'
        >
          ISO Date & Time
        </Text>

        <Box
          bg='rgba(0, 0, 0, 0.3)'
          borderRadius='3px'
          p='2'
          fontFamily='mono'
          letterSpacing='0px'
          position='relative'
          overflow='hidden'
          borderRight='2px solid'
          borderColor='brand.neonGreen'
          color='brand.neonBlue'
          fontSize='lg'
          textAlign='right'
          width='100%'
          whiteSpace='nowrap'
          overflowX='auto'
          css={{
            '&::-webkit-scrollbar': {
              height: '2px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 204, 255, 0.3)',
              borderRadius: '1px',
            },
          }}
        >
          {formatISODateTime(currentTime)}
        </Box>
      </Flex>
    </Box>
  );
};

export default ClockBox;
