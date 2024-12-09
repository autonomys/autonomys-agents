import { Card, CardBody, Text, Spinner, VStack, Link, HStack } from '@chakra-ui/react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'

function MemoryViewer() {
    const { cid } = useParams()
    const { data: memory, isLoading, error } = useMemory(cid || '')
    console.log(memory)
    if (isLoading) return <Spinner color="#00ff00" />
    if (error) return <Text color="red.500">Error loading memory: {error.message}</Text>
    if (!memory) return <Text>No memory found</Text>

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardBody>
                    <HStack justify="space-between" mb={4}>
                        <Text fontSize="sm" color="#00ff00">
                            Memory CID: {cid}
                        </Text>
                        {memory.previousCid && (
                            <Link
                                as={RouterLink}
                                to={`/memory/${memory.previousCid}`}
                                color="#00ff00"
                                display="flex"
                                alignItems="center"
                                gap={2}
                            >
                                Previous CID <ExternalLinkIcon mx="2px" />
                            </Link>
                        )}
                    </HStack>
                    <Text fontSize="sm" color="#00ff00" mb={2}>
                        Original Tweet by @{memory.updatedResponse.tweet.author_username}
                    </Text>
                    <Text whiteSpace="pre-wrap" mb={4}>
                        {memory.updatedResponse.tweet.content}
                    </Text>
                    <Text fontSize="sm" color="#00ff00" mb={2}>
                        Response:
                    </Text>
                    <Text whiteSpace="pre-wrap" mb={4}>
                        {memory.updatedResponse.response.content}
                    </Text>
                    <Text fontSize="sm" color="#00ff00">
                        Strategy: {memory.updatedResponse.response.strategy}
                    </Text>
                    <Text fontSize="sm" color="#00ff00">
                        Tone: {memory.updatedResponse.response.tone}
                    </Text>
                    <Text fontSize="sm" color="#00ff00">
                        Status: {memory.updatedResponse.status}
                    </Text>
                </CardBody>
            </Card>
        </VStack>
    )
}

export default MemoryViewer 