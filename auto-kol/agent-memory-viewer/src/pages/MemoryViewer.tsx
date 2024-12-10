import { Card, CardBody, Text, Spinner, VStack, Link, HStack } from '@chakra-ui/react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'

function MemoryViewer() {
    const { cid } = useParams()
    const { data: memory, isLoading, error } = useMemory(cid || '')

    if (isLoading) return <Spinner color="#00ff00" />
    if (error) return <Text color="red.500">Error loading memory: {error.message}</Text>
    if (!memory) return <Text>No memory found</Text>

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardBody>
                    <HStack justify="space-between" mb={4}>
                        <Text fontSize="sm" color="gray.400">
                            Memory CID: <Text as="span" color="green.400">{cid}</Text>
                        </Text>
                        {memory.previousCid ? (
                            <Link
                                as={RouterLink}
                                to={`/memory/${memory.previousCid}`}
                                color="blue.400"
                                display="flex"
                                alignItems="center"
                                gap={2}
                                _hover={{ color: 'blue.300' }}
                            >
                                Previous CID <ExternalLinkIcon mx="2px" />
                            </Link>
                        ) : (
                            <Text color="gray.400">Genesis of Memory</Text>
                        )}
                    </HStack>

                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                        Tweet Information
                    </Text>
                    <VStack align="stretch" mb={4} pl={4}>
                        <Text>
                            <Text as="span" color="gray.400">ID:</Text>{' '}
                            <Text as="span" color="white">{memory.tweet.id}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Author ID:</Text>{' '}
                            <Text as="span" color="white">{memory.tweet.author_id}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Author:</Text>{' '}
                            <Text as="span" color="blue.400">@{memory.tweet.author_username}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Created At:</Text>{' '}
                            <Text as="span" color="white">{new Date(memory.tweet.created_at).toLocaleString()}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Content:</Text>{' '}
                            <Text as="span" color="white">{memory.tweet.text}</Text>
                        </Text>
                    </VStack>

                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                        Decision
                    </Text>
                    <VStack align="stretch" mb={4} pl={4}>
                        <Text>
                            <Text as="span" color="gray.400">Should Engage:</Text>{' '}
                            <Text as="span" color={memory.decision.shouldEngage ? "green.400" : "red.400"}>
                                {memory.decision.shouldEngage ? 'Yes' : 'No'}
                            </Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Reason:</Text>{' '}
                            <Text as="span" color="white">{memory.decision.reason}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Priority:</Text>{' '}
                            <Text as="span" color="orange.400">{memory.decision.priority}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Confidence:</Text>{' '}
                            <Text as="span" color="orange.400">{memory.decision.confidence}</Text>
                        </Text>
                    </VStack>

                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                        Additional Information
                    </Text>
                    <VStack align="stretch" mb={4} pl={4}>
                        <Text>
                            <Text as="span" color="gray.400">Previous CID:</Text>{' '}
                            {memory.previousCid ? (
                                <Link
                                    as={RouterLink}
                                    to={`/memory/${memory.previousCid}`}
                                    color="blue.400"
                                    _hover={{ color: 'blue.300' }}
                                >
                                    {memory.previousCid}
                                </Link>
                            ) : (
                                <Text as="span" color="white">None</Text>
                            )}
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Signature:</Text>{' '}
                            <Text as="span" color="white">{memory.signature || 'None'}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Timestamp:</Text>{' '}
                            <Text as="span" color="white">{new Date(memory.timestamp).toLocaleString()}</Text>
                        </Text>
                    </VStack>
                </CardBody>
            </Card>
        </VStack>
    )
}

export default MemoryViewer 