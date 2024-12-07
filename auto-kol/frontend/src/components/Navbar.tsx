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
        rounded="md"
        bg={isActive ? 'brand.50' : 'transparent'}
        color={isActive ? 'brand.600' : 'gray.600'}
        _hover={{
            bg: isActive ? 'brand.50' : 'gray.100',
        }}
        display="flex"
        alignItems="center"
        gap={2}
    >
        <Icon as={icon} />
        <Text>{children}</Text>
    </Link>
)

function Navbar() {
    const location = useLocation()

    return (
        <Box as="nav" bg="white" shadow="sm">
            <Flex maxW="container.xl" mx="auto" px={4} py={4} gap={4}>
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
                <NavItem
                    to="/settings"
                    icon={FiSettings}
                    isActive={location.pathname === '/settings'}
                >
                    Settings
                </NavItem>
            </Flex>
        </Box>
    )
}

export default Navbar 