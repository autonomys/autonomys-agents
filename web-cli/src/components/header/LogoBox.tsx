import React from 'react';
import { Box, Flex, Heading, Text, Image } from '@chakra-ui/react';

const LogoBox: React.FC = () => {
  return (
    <Box textAlign='center' py='4'>
      <Flex justifyContent='center' alignItems='center' mb='2'>
        <Text
          as='span'
          color='brand.neonGreen'
          fontSize='2xl'
          fontWeight='bold'
          mr='2'
          textShadow='0 0 8px rgba(0, 255, 153, 0.7)'
          className='bracket-left'
        >
          [
        </Text>

        <Box className='logo-container' position='relative'>
          <Box className='logo-orbit'></Box>
          <Box className='logo-orbit' style={{ animationDelay: '-2s', opacity: 0.7 }}></Box>
          <Box className='logo-orbit' style={{ animationDelay: '-4s', opacity: 0.4 }}></Box>
          <Box className='logo-scan'></Box>
          <Image
            src={`${process.env.PUBLIC_URL}/assets/logo.svg`}
            alt='Autonomys Logo'
            w='50px'
            h='50px'
            filter='drop-shadow(0 0 8px rgba(0, 255, 153, 0.7))'
            className='logo-image'
          />
        </Box>

        <Text
          as='span'
          color='brand.neonGreen'
          fontSize='2xl'
          fontWeight='bold'
          ml='2'
          textShadow='0 0 8px rgba(0, 255, 153, 0.7)'
          className='bracket-right'
        >
          ]
        </Text>
      </Flex>

      <Heading
        as='h1'
        size='xl'
        letterSpacing='2px'
        textTransform='uppercase'
        className='title-agentic'
      >
        AUTONOMYS AGENTS
      </Heading>

      <Box
        width='80%'
        height='2px'
        bg='linear-gradient(to right, transparent, #00ff99, transparent)'
        margin='0.5rem auto'
        position='relative'
        _after={{
          content: '""',
          position: 'absolute',
          top: '-1px',
          left: '0',
          right: '0',
          height: '4px',
          bgGradient: 'linear(to-r, transparent, brand.neonGreen, transparent)',
          filter: 'blur(2px)',
          animation: 'pulse 2s infinite alternate',
        }}
      />

      <Text
        color='brand.neonBlue'
        fontSize='sm'
        letterSpacing='2px'
        textShadow='0 0 5px rgba(0, 204, 255, 0.7)'
        position='relative'
        display='inline-block'
        _after={{
          content: '""',
          position: 'absolute',
          bottom: '-2px',
          left: '10%',
          width: '80%',
          height: '1px',
          bg: 'brand.neonBlue',
          filter: 'blur(1px)',
          animation: 'pulse 1.5s infinite alternate',
        }}
      >
        :: WEB CLI v0.4 ::
      </Text>
    </Box>
  );
};

export default LogoBox;
