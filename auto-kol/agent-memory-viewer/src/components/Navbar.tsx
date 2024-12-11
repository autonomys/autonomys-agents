import { Box, Flex, Link, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

function Navbar() {
    return (
        <Box as="nav" bg="#001100" borderBottom="2px solid #00ff00">
            <Flex maxW="container.xl" mx="auto" px={4} py={4} justify="space-between" align="center">
                <Link
                    as={RouterLink}
                    to="/"
                    px={4}
                    py={2}
                    border="2px solid #00ff00"
                    borderStyle="outset"
                    bg="#001100"
                    color="#00ff00"
                    _hover={{
                        textDecoration: 'none',
                        bg: '#002200',
                        boxShadow: '0 0 10px #00ff00',
                    }}
                >
                    <Text fontFamily="Monaco, 'Courier New', monospace">
                        [Agent Memory Viewer]
                    </Text>
                </Link>
            </Flex>
        </Box>
    )
}

export default Navbar 