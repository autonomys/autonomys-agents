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

  // Format the date in YYYY-MM-DD format
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Format the time in HH:MM:SS format
  const formatTime = (date: Date) => {
    // Using a shorter time format to prevent truncation
    const timeString = date.toTimeString().split(' ')[0];
    return timeString;
  };

  return (
    <Box
      bg="linear-gradient(135deg, #003366, #001830)"
      clipPath="polygon(5% 0, 100% 0, 100% 100%, 0% 100%)"
      position="relative"
      overflow="hidden"
      textAlign="right"
      p="3"
      height="94px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      py="3"
    >
      <Flex direction="column" alignItems="flex-end" width="100%">
        <Text 
          color="brand.neonPink" 
          textTransform="uppercase" 
          fontSize="xs" 
          mb="1.5" 
          textAlign="right" 
          textShadow="0 0 5px rgba(255, 0, 204, 0.5)"
        >
          Date & Time
        </Text>
        
        <Box 
          bg="rgba(0, 0, 0, 0.3)"
          borderRadius="3px"
          p="1"
          fontFamily="mono"
          letterSpacing="0px"
          position="relative"
          overflow="hidden"
          borderRight="2px solid"
          borderColor="brand.neonGreen"
          color="brand.neonBlue"
          fontSize="xs"
          mb="1.5"
          textAlign="right"
        >
          {formatDate(currentTime)}
        </Box>
        
        <Box 
          bg="rgba(0, 0, 0, 0.3)"
          borderRadius="3px"
          p="1"
          fontFamily="mono"
          letterSpacing="0px"
          position="relative"
          overflow="hidden"
          borderRight="2px solid"
          borderColor="brand.neonGreen"
          color="brand.neonBlue"
          fontSize="md"
          fontWeight="bold"
          textAlign="right"
          mt="0"
        >
          {formatTime(currentTime)}
        </Box>
      </Flex>
    </Box>
  );
};

export default ClockBox;
