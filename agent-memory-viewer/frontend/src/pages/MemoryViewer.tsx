import { Card, CardBody, Text, Spinner, VStack, HStack, Button, Link, Box, Badge } from '@chakra-ui/react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'
import ReactJson from 'react-json-view'

function MemoryViewer() {
    const { cid } = useParams()
    const navigate = useNavigate()
    const { data: memory, isLoading, error } = useMemory(cid || '')

    const explorerUrl = `https://astral.autonomys.xyz/taurus/permanent-storage/files/${cid}`

    if (isLoading) return <Spinner color="green.400" />
    if (error) return <Text color="red.500">Error loading memory: {error.message}</Text>
    if (!memory) return <Text>No memory found</Text>

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardBody>
                    {/* Header */}
                    <HStack justify="space-between" mb={4}>
                        <VStack align="start" spacing={1}>
                            <HStack>
                                <Text fontSize="lg" fontWeight="bold" color="green.400">
                                    Memory CID: {cid}
                                </Text>
                                <Badge colorScheme={getTypeColorScheme(memory.type)}>
                                    {memory.type}
                                </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                                Agent Version: {memory.agentVersion}
                            </Text>
                        </VStack>
                        <HStack spacing={4}>
                            <Link
                                href={explorerUrl}
                                isExternal
                                color="blue.400"
                                _hover={{ color: 'blue.300' }}
                            >
                                View in Explorer <ExternalLinkIcon mx="2px" />
                            </Link>
                            {memory.previousCid && (
                                <Link
                                    as={RouterLink}
                                    to={`/memory/${memory.previousCid}`}
                                    color="blue.400"
                                    _hover={{ color: 'blue.300' }}
                                >
                                    Previous CID
                                </Link>
                            )}
                        </HStack>
                    </HStack>

                    {/* JSON Content */}
                    <Box 
                        borderRadius="lg"
                        overflow="hidden"
                        bg="blackAlpha.400"
                        p={4}
                        mb={4}
                    >
                        <ReactJson 
                            src={memory}
                            theme="tomorrow"
                            collapsed={false}
                            displayDataTypes={false}
                            name={false}
                            style={{
                                backgroundColor: 'transparent',
                                borderRadius: '0.5rem',
                                fontSize: '0.9em',
                            }}
                            enableClipboard={true}
                            displayObjectSize={false}
                        />
                    </Box>
                    
                    {/* Back Button */}
                    <Button
                        leftIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/')}
                        colorScheme="green"
                        variant="outline"
                        size="lg"
                        width="full"
                        mt={4}
                    >
                        Back to Home
                    </Button>
                </CardBody>
            </Card>
        </VStack>
    )
}

// Helper function from DSNViewer
const getTypeColorScheme = (type: string | undefined): string => {
    if (!type) return 'gray';
    const colorSchemes = ['teal', 'blue', 'cyan', 'purple', 'pink', 'orange', 'yellow', 'green', 'red'];
    const hash = type.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return colorSchemes[Math.abs(hash) % colorSchemes.length];
};

export default MemoryViewer 