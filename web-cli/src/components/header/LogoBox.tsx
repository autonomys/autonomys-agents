import React from 'react';
import { Box, Flex, Heading, Text, Image } from '@chakra-ui/react';

const LogoBox: React.FC = () => {
  return (
    <Box textAlign="center" py="4" bg="rgba(0, 0, 0, 0.3)">
      <Flex justifyContent="center" alignItems="center" mb="2">
        <Text as="span" color="brand.neonGreen" fontSize="2xl" fontWeight="bold" mr="2" textShadow="0 0 8px rgba(0, 255, 153, 0.7)">
          [
        </Text>
        <Image 
          src={`${process.env.PUBLIC_URL}/assets/logo.svg`}
          alt="Autonomys Logo"
          w="50px"
          h="50px"
          filter="drop-shadow(0 0 8px rgba(0, 255, 153, 0.7))"
          animation="pulse 2s infinite alternate"
        />
        <Text as="span" color="brand.neonGreen" fontSize="2xl" fontWeight="bold" ml="2" textShadow="0 0 8px rgba(0, 255, 153, 0.7)">
          ]
        </Text>
      </Flex>
      <Heading 
        as="h1" 
        size="xl" 
        color="brand.neonGreen" 
        textShadow="0 0 10px rgba(0, 255, 153, 0.7), 0 0 20px rgba(0, 255, 153, 0.5)" 
        letterSpacing="2px" 
        textTransform="uppercase" 
        animation="pulsate 2s infinite alternate"
      >
        AUTONOMYS AGENTS
      </Heading>
      <Box 
        width="80%" 
        height="1px" 
        bg="linear-gradient(to right, transparent, #00ff99, transparent)" 
        margin="0.5rem auto"
      />
      <Text color="brand.neonBlue" fontSize="sm" letterSpacing="2px" textShadow="0 0 5px rgba(0, 204, 255, 0.7)">
        :: WEB CLI v0.1 ::
      </Text>
    </Box>
  );
};

export default LogoBox;
