import { Card, CardBody, Text, Spinner, VStack, HStack, Button, Link, Box, Badge, IconButton, Divider, Tooltip } from '@chakra-ui/react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon, ExternalLinkIcon, CopyIcon, TimeIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'
import ReactJson from 'react-json-view'
import { utcToLocalRelativeTime } from '../utils/timeUtils'

function MemoryViewer() {
    const { cid } = useParams()
    const navigate = useNavigate()
    const { data: memory, isLoading, error } = useMemory(cid || '')
    const explorerUrl = `https://astral.autonomys.xyz/taurus/permanent-storage/files/${cid}`

    if (isLoading) return <Spinner color="green.400" thickness="4px" size="xl" />
    if (error) return <Text color="red.500">Error loading memory: {error.message}</Text>
    if (!memory) return <Text>No Experience found</Text>

    return (
        <VStack spacing={6} align="stretch">
            {/* Navigation Bar */}
            <HStack justify="space-between" w="full">
                <Button
                    leftIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    variant="outline"
                    color="green.400"
                    borderColor="green.400"
                    _hover={{
                        bg: 'green.400',
                        color: 'black'
                    }}
                >
                    Back to Home
                </Button>
                <HStack spacing={2}>
                    <Badge 
                        colorScheme="purple"
                        fontSize="md"
                        px={3}
                        py={1}
                        borderRadius="full"
                    >
                        {memory.agent_name}
                    </Badge>
                    {/* <Badge 
                        colorScheme={getTypeColorScheme(memory.type)}
                        fontSize="md"
                        px={3}
                        py={1}
                        borderRadius="full"
                    >
                        {memory.type}
                    </Badge> */}
                </HStack>
            </HStack>

            {/* Main Content Card */}
            <Card 
                bg="blackAlpha.400" 
                borderColor="green.400" 
                borderWidth="1px"
                boxShadow="0 0 20px rgba(72, 187, 120, 0.2)"
            >
                <CardBody>
                    {/* Memory Details */}
                    <VStack align="stretch" spacing={4}>
                        {/* CID and Version */}
                        <HStack justify="space-between" wrap="wrap" spacing={4}>
                            <VStack align="start" spacing={1}>
                                <Text color="gray.400" fontSize="sm">Experience CID</Text>
                                <HStack>
                                    <Text color="green.400" fontFamily="mono" fontSize="lg">
                                        {cid}
                                    </Text>
                                    <IconButton
                                        aria-label="Copy CID"
                                        icon={<CopyIcon />}
                                        size="sm"
                                        variant="ghost"
                                        color="green.400"
                                        onClick={() => navigator.clipboard.writeText(cid || '')}
                                    />
                                </HStack>
                            </VStack>
                            <VStack align="end" spacing={1}>
                                <Text color="gray.400" fontSize="sm">Agent Info</Text>
                                <HStack spacing={2}>
                                   
                                    <Text color="green.400" fontFamily="mono">
                                        v{memory.agentVersion}
                                    </Text>
                                </HStack>
                            </VStack>
                        </HStack>

                        <Divider borderColor="whiteAlpha.200" />

                        {/* Timestamp and Links */}
                        <HStack justify="space-between" wrap="wrap" spacing={4}>
                            <HStack spacing={4}>
                                {memory.previousCid && (
                                    <Link
                                        as={RouterLink}
                                        to={`/memory/${memory.previousCid}`}
                                        color="green.400"
                                        _hover={{ color: 'green.300' }}
                                    >
                                        <HStack>
                                            <ArrowBackIcon />
                                            <Text>Previous Experience</Text>
                                        </HStack>
                                    </Link>
                                )}
                                <Link
                                    href={explorerUrl}
                                    isExternal
                                    color="green.400"
                                    _hover={{ color: 'green.300' }}
                                >
                                    View in Explorer <ExternalLinkIcon mx="2px" />
                                </Link>
                            </HStack>
                            <Tooltip label={new Date(memory.timestamp).toLocaleString()}>
                                <HStack color="gray.400">
                                    <TimeIcon />
                                    <Text>{utcToLocalRelativeTime(memory.timestamp)}</Text>
                                </HStack>
                            </Tooltip>
                        </HStack>

                        <Divider borderColor="whiteAlpha.200" />

                        {/* JSON Content */}
                        <Box 
                            borderRadius="lg"
                            bg="blackAlpha.500"
                            p={4}
                            position="relative"
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
                                quotesOnKeys={false}
                                indentWidth={2}
                            />
                        </Box>
                    </VStack>
                </CardBody>
            </Card>
        </VStack>
    )
}

export default MemoryViewer 