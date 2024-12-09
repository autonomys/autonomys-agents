import { Box, Button, Card, CardBody, Text, HStack, Link, Spinner } from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'

function MemoryViewer() {
    const { cid } = useParams()
    const navigate = useNavigate()
    const { data: memory, isLoading, error } = useMemory(cid || '')

    if (isLoading) return <Spinner color="#00ff00" />
    if (error) return <Text color="red.500">Error loading memory: {(error as Error).message}</Text>
    if (!memory) return <Text>No memory found</Text>

    return (
        <Box>
            <Card mb={4}>
                <CardBody>
                    <Text fontFamily="Monaco" fontSize="sm" color="#00ff00" mb={4}>
                        CID: {memory.cid}
                    </Text>
                    <Text whiteSpace="pre-wrap" mb={4}>
                        {memory.content}
                    </Text>
                    <Link
                        href={`https://explorer.autonomy.network/tx/${memory.transactionHash}`}
                        isExternal
                        color="#00ff00"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        mb={4}
                    >
                        View transaction <ExternalLinkIcon mx="2px" />
                    </Link>
                    <HStack spacing={4}>
                        {memory.previousCid && (
                            <Button
                                onClick={() => navigate(`/memory/${memory.previousCid}`)}
                                variant="outline"
                            >
                                Previous Memory
                            </Button>
                        )}
                        <Button
                            onClick={() => navigate(`/agents/${memory.agentId}`)}
                            variant="outline"
                        >
                            Agent Profile
                        </Button>
                    </HStack>
                </CardBody>
            </Card>
        </Box>
    )
}

export default MemoryViewer 