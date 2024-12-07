import { Box, Flex, Link, Icon, Text } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { FiHome, FiMessageSquare, FiSkipForward, FiSettings } from 'react-icons/fi'

const NavItem = ({ to, icon, children, isActive }: {
    to: string;
    icon: any;
    children: React.ReactNode;
    isActive: boolean;
}) => (
    <Link
        as={RouterLink}
        to={to}
        px={4}
        py={2}
        border="2px solid #00ff00"
        borderStyle={isActive ? 'inset' : 'outset'}
        bg="#001100"
        color="#00ff00"
        _hover={{
            textDecoration: 'none',
            bg: '#002200',
            boxShadow: '0 0 10px #00ff00',
        }}
        display="flex"
        alignItems="center"
        gap={2}
    >
        <Icon as={icon} color="#00ff00" />
        <Text fontFamily="Monaco, 'Courier New', monospace">
            [{children}]
        </Text>
    </Link>
)

function Navbar() {
    const location = useLocation()

    return (
        <Box as="nav" bg="white" shadow="sm">
            <Flex maxW="container.xl" mx="auto" px={4} py={4} gap={4} justify="center">
                <NavItem
                    to="/"
                    icon={FiHome}
                    isActive={location.pathname === '/'}
                >
                    Dashboard
                </NavItem>
                <NavItem
                    to="/responses"
                    icon={FiMessageSquare}
                    isActive={location.pathname === '/responses'}
                >
                    Responses
                </NavItem>
                <NavItem
                    to="/skipped"
                    icon={FiSkipForward}
                    isActive={location.pathname === '/skipped'}
                >
                    Skipped
                </NavItem>

            </Flex>
        </Box>
    )
}

export default Navbar 