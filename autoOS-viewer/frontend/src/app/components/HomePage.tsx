'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Box, Heading, Input, SimpleGrid, Text, Flex, Badge, VStack } from '@chakra-ui/react'

// Mock data for initial display
const mockPackages = [
  {
    id: '1',
    name: 'agent-pkg-example',
    description: 'An example agent package for demonstration purposes',
    version: '1.0.0',
    author: 'Autonomys',
    createdAt: '2023-12-01T12:00:00Z',
  },
  {
    id: '2',
    name: 'agent-pkg-utils',
    description: 'Utility functions for agent packages',
    version: '0.2.3',
    author: 'Autonomys',
    createdAt: '2023-12-15T14:30:00Z',
  },
  {
    id: '3',
    name: 'agent-pkg-core',
    description: 'Core functionality for agent packages',
    version: '1.2.0',
    author: 'Autonomys',
    createdAt: '2024-01-10T09:15:00Z',
  },
]

export default function HomePage() {
  const [packages, setPackages] = useState(mockPackages)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // In a real implementation, this would fetch data from your backend
  // useEffect(() => {
  //   const fetchPackages = async () => {
  //     setLoading(true)
  //     try {
  //       const response = await fetch('/api/packages')
  //       const data = await response.json()
  //       setPackages(data)
  //     } catch (error) {
  //       console.error('Error fetching packages:', error)
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  //
  //   fetchPackages()
  // }, [])

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Box p={4}>
      <Heading as="h1" mb={6} color="primary.500">Agent Package Registry</Heading>
      
      <Box mb={6} maxW="500px">
        <Input
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          bg="rgba(0, 17, 0, 0.8)"
          border="1px solid"
          borderColor="primary.500"
          color="primary.500"
          _placeholder={{ color: 'primary.300' }}
        />
      </Box>

      {loading ? (
        <Text color="primary.500">Loading packages...</Text>
      ) : filteredPackages.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredPackages.map((pkg) => (
            <Link href={`/package/${pkg.id}`} key={pkg.id} style={{ textDecoration: 'none' }}>
              <Box 
                borderWidth="1px" 
                borderColor="primary.500"
                bg="rgba(0, 17, 0, 0.8)"
                borderRadius="md"
                p={4}
                height="200px"
                display="flex"
                flexDirection="column"
                _hover={{ 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 255, 0, 0.15)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Heading as="h3" size="md" color="primary.500" mb={2}>{pkg.name}</Heading>
                <Text color="white" mb={4} flex="1" overflow="hidden">{pkg.description}</Text>
                <Box mt="auto">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.400">By {pkg.author}</Text>
                    <Badge colorScheme="green">v{pkg.version}</Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.400" mt={2}>
                    Published: {formatDate(pkg.createdAt)}
                  </Text>
                </Box>
              </Box>
            </Link>
          ))}
        </SimpleGrid>
      ) : (
        <Text color="primary.500">
          No packages found matching "{searchTerm}"
        </Text>
      )}
    </Box>
  )
} 