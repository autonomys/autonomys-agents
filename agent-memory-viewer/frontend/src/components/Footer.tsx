import { Box, Text, HStack, Link, VStack } from '@chakra-ui/react';
import { colors } from '../styles/theme/colors';
import { currentYear } from '../utils/timeUtils';

export const Footer = () => {
  return (
    <Box
      as="footer"
      borderTop="2px solid"
      borderColor={colors.primary}
      mt="auto"
      py={4}
      bg="rgba(0, 17, 0, 0.9)"
      backdropFilter="blur(10px)"
      boxShadow="0 0 20px rgba(0, 255, 0, 0.2)"
    >
      <VStack maxW="container.xl" mx="auto" px={4} spacing={2}>
        <HStack spacing={4} justify="center" wrap="wrap">
          <Link
            href="https://www.autonomys.xyz/"
            target="_blank"
            color={colors.primary}
            _hover={{ textDecoration: 'none', textShadow: '0 0 10px #00ff00' }}
          >
            Website
          </Link>
          <Text color={colors.primary}>•</Text>
          <Link
            href="https://github.com/autonomys/autonomys-agents"
            target="_blank"
            color={colors.primary}
            _hover={{ textDecoration: 'none', textShadow: '0 0 10px #00ff00' }}
          >
            Documentation
          </Link>
          <Text color={colors.primary}>•</Text>
          <Link
            href="https://github.com/autonomys"
            target="_blank"
            color={colors.primary}
            _hover={{ textDecoration: 'none', textShadow: '0 0 10px #00ff00' }}
          >
            GitHub
          </Link>
        </HStack>
        <Text
          fontSize="sm"
          color="rgba(0, 255, 0, 0.6)"
          textAlign="center"
          fontFamily="Monaco, 'Courier New', monospace"
        >
          © {currentYear()} Autonomys Network
        </Text>
      </VStack>
    </Box>
  );
}; 