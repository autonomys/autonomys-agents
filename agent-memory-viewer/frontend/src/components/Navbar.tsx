import { Box, Flex, Link, Text, HStack, VStack, Image } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

function Navbar() {
    return (
        <Box 
            as="nav" 
            bg="rgba(0, 17, 0, 0.9)"
            borderBottom="2px solid #00ff00"
            backdropFilter="blur(10px)"
            position="sticky"
            top={0}
            zIndex={1000}
            boxShadow="0 0 20px rgba(0, 255, 0, 0.2)"
        >
            <Flex 
                maxW="container.xl" 
                mx="auto" 
                px={4} 
                py={4} 
                justify="space-between" 
                align="center"
            >
                <Link
                    as={RouterLink}
                    to="/"
                    px={4}
                    py={2}
                    border="2px solid #00ff00"
                    borderStyle="outset"
                    bg="rgba(0, 17, 0, 0.8)"
                    color="#00ff00"
                    transition="all 0.3s ease"
                    textShadow="0 0 5px #00ff00"
                    _hover={{
                        textDecoration: 'none',
                        bg: 'rgba(0, 34, 0, 0.8)',
                        boxShadow: '0 0 15px #00ff00',
                        transform: 'translateY(-2px)',
                    }}
                    _active={{
                        transform: 'translateY(1px)',
                    }}
                >
                    <Text 
                        fontFamily="Monaco, 'Courier New', monospace"
                        fontWeight="bold"
                        letterSpacing="1px"
                    >
                        [Agent Experience Viewer]
                    </Text>
                </Link>
                <HStack spacing={3} align="center">
                    <VStack 
                        spacing={0} 
                        align="end"
                    >
                        <Text
                            color="rgba(0, 255, 0, 0.4)"
                            fontSize="xs"
                            fontFamily="Monaco, 'Courier New', monospace"
                            letterSpacing="2px"
                        >
                            {'<network>'}
                        </Text>
                        <Text
                            color="#00ff00"
                            fontSize="md"
                            fontWeight="bold"
                            fontFamily="Monaco, 'Courier New', monospace"
                            letterSpacing="2px"
                            textShadow="0 0 10px #00ff00"
                            transform="translateY(-2px)"
                        >
                            AUTONOMYS
                        </Text>
                        <Text
                            color="rgba(0, 255, 0, 0.4)"
                            fontSize="xs"
                            fontFamily="Monaco, 'Courier New', monospace"
                            letterSpacing="2px"
                            transform="translateY(-4px)"
                        >
                            {'</network>'}
                        </Text>
                    </VStack>
                    <Image
                        src="/autonomys-logo.png"
                        alt="Autonomys Logo"
                        height="40px"
                        width="40px"
                        filter="drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))"
                        transition="all 0.3s ease"
                        _hover={{
                            filter: 'drop-shadow(0 0 12px rgba(0, 255, 0, 0.7))',
                            transform: 'scale(1.05)',
                        }}
                    />
                </HStack>
            </Flex>
        </Box>
    )
}

export default Navbar 