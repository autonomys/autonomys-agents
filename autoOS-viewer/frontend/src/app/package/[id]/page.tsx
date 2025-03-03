'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Flex, 
  Grid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  Code, 
  VStack, 
  HStack, 
  Button, 
  Link as ChakraLink,
  Divider
} from '@chakra-ui/react'
import { ExternalLinkIcon, ArrowBackIcon } from '@chakra-ui/icons'
import AppLayout from '../../components/AppLayout'

interface PackageDependencies {
  [key: string]: string;
}

interface PackageData {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  readme: string;
  dependencies: PackageDependencies;
  downloads: number;
  license: string;
  repository: string;
}

// Mock data for initial display
const mockPackages: PackageData[] = [
  {
    id: '1',
    name: 'agent-pkg-example',
    description: 'An example agent package for demonstration purposes',
    version: '1.0.0',
    author: 'Autonomys',
    createdAt: '2023-12-01T12:00:00Z',
    readme: '# Agent Package Example\n\nThis is an example agent package for demonstration purposes.\n\n## Installation\n\n```bash\nnpm install agent-pkg-example\n```\n\n## Usage\n\n```javascript\nimport { Agent } from "agent-pkg-example";\n\nconst agent = new Agent();\nagent.start();\n```',
    dependencies: {
      'react': '^18.0.0',
      'next': '^13.0.0',
      'typescript': '^5.0.0'
    },
    downloads: 1245,
    license: 'MIT',
    repository: 'https://github.com/autonomys/agent-pkg-example'
  },
  {
    id: '2',
    name: 'agent-pkg-utils',
    description: 'Utility functions for agent packages',
    version: '0.2.3',
    author: 'Autonomys',
    createdAt: '2023-12-15T14:30:00Z',
    readme: '# Agent Package Utils\n\nUtility functions for agent packages.\n\n## Installation\n\n```bash\nnpm install agent-pkg-utils\n```\n\n## Usage\n\n```javascript\nimport { formatData } from "agent-pkg-utils";\n\nconst formattedData = formatData(rawData);\n```',
    dependencies: {
      'lodash': '^4.17.21',
      'date-fns': '^2.29.3'
    },
    downloads: 3782,
    license: 'MIT',
    repository: 'https://github.com/autonomys/agent-pkg-utils'
  },
  {
    id: '3',
    name: 'agent-pkg-core',
    description: 'Core functionality for agent packages',
    version: '1.2.0',
    author: 'Autonomys',
    createdAt: '2024-01-10T09:15:00Z',
    readme: '# Agent Package Core\n\nCore functionality for agent packages.\n\n## Installation\n\n```bash\nnpm install agent-pkg-core\n```\n\n## Usage\n\n```javascript\nimport { Core } from "agent-pkg-core";\n\nconst core = new Core();\ncore.initialize();\n```',
    dependencies: {
      'react': '^18.0.0',
      'axios': '^1.3.4',
      'zod': '^3.21.4'
    },
    downloads: 5621,
    license: 'MIT',
    repository: 'https://github.com/autonomys/agent-pkg-core'
  }
]

export default function PackageDetail() {
  const params = useParams()
  const id = params.id as string
  const [pkg, setPkg] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch data from your backend
    setLoading(true)
    const foundPackage = mockPackages.find(p => p.id === id)
    setPkg(foundPackage || null)
    setLoading(false)
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Function to render README content
  const renderReadmeContent = () => {
    if (!pkg) return null;
    
    return pkg.readme.split('\n').map((line: string, index: number) => {
      if (line.startsWith('# ')) {
        return <Heading as="h1" size="xl" mt={6} mb={4} key={index}>{line.substring(2)}</Heading>
      } else if (line.startsWith('## ')) {
        return <Heading as="h2" size="lg" mt={5} mb={3} key={index}>{line.substring(3)}</Heading>
      } else if (line.startsWith('```')) {
        return <Code p={3} my={3} display="block" borderRadius="md" bg="gray.800" key={index}>{line.substring(3) || ''}</Code>
      } else {
        return <Text my={2} key={index}>{line}</Text>
      }
    })
  }

  const content = () => {
    if (loading) {
      return <Text color="primary.500" fontSize="lg">Loading package details...</Text>
    }

    if (!pkg) {
      return <Text color="primary.500" fontSize="lg">Package not found</Text>
    }

    return (
      <Box p={6}>
        <Box mb={8}>
          <Button 
            as={Link} 
            href="/" 
            leftIcon={<ArrowBackIcon />} 
            variant="outline" 
            colorScheme="green" 
            mb={4}
          >
            Back to Registry
          </Button>
          
          <Heading as="h1" size="2xl" color="primary.500" mb={3}>{pkg.name}</Heading>
          
          <Flex align="center" gap={4} mb={4} flexWrap="wrap">
            <Badge colorScheme="green" fontSize="md" px={2} py={1}>v{pkg.version}</Badge>
            <Text color="gray.400">By {pkg.author}</Text>
            <Text color="gray.400">Published: {formatDate(pkg.createdAt)}</Text>
          </Flex>
          
          <Text fontSize="xl" color="white" mb={6}>{pkg.description}</Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
          <Stat bg="rgba(0, 17, 0, 0.8)" p={4} borderRadius="md" borderWidth="1px" borderColor="primary.500">
            <StatLabel color="gray.400">Downloads</StatLabel>
            <StatNumber color="primary.500">{pkg.downloads.toLocaleString()}</StatNumber>
          </Stat>
          
          <Stat bg="rgba(0, 17, 0, 0.8)" p={4} borderRadius="md" borderWidth="1px" borderColor="primary.500">
            <StatLabel color="gray.400">License</StatLabel>
            <StatNumber color="primary.500">{pkg.license}</StatNumber>
          </Stat>
          
          <Stat bg="rgba(0, 17, 0, 0.8)" p={4} borderRadius="md" borderWidth="1px" borderColor="primary.500">
            <StatLabel color="gray.400">Repository</StatLabel>
            <ChakraLink href={pkg.repository} isExternal color="primary.500">
              GitHub <ExternalLinkIcon mx="2px" />
            </ChakraLink>
          </Stat>
        </Grid>

        <VStack align="stretch" spacing={8} mb={8}>
          <Box>
            <Heading as="h2" size="lg" color="primary.500" mb={4}>Installation</Heading>
            <Code p={4} borderRadius="md" bg="gray.800" fontSize="md" display="block">
              npm install {pkg.name}
            </Code>
          </Box>

          <Box>
            <Heading as="h2" size="lg" color="primary.500" mb={4}>Dependencies</Heading>
            <VStack align="stretch" spacing={2} bg="rgba(0, 17, 0, 0.8)" p={4} borderRadius="md" borderWidth="1px" borderColor="primary.500">
              {Object.entries(pkg.dependencies).map(([name, version]) => (
                <Flex key={name} justify="space-between" p={2} _hover={{ bg: "rgba(0, 255, 0, 0.05)" }}>
                  <Text color="white">{name}</Text>
                  <Badge colorScheme="green">{version}</Badge>
                </Flex>
              ))}
            </VStack>
          </Box>

          <Box>
            <Heading as="h2" size="lg" color="primary.500" mb={4}>README</Heading>
            <Box bg="rgba(0, 17, 0, 0.8)" p={6} borderRadius="md" borderWidth="1px" borderColor="primary.500">
              {renderReadmeContent()}
            </Box>
          </Box>
        </VStack>
      </Box>
    );
  };

  return (
    <AppLayout>
      {content()}
    </AppLayout>
  );
} 