import { Card, CardBody, Text, Spinner, VStack, Link, HStack, Box, Button } from '@chakra-ui/react'
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom'
import { ExternalLinkIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'
import { ResponseStatus } from '@/types/enums'
import { getStatusColor } from '../utils/statusColors'

function MemoryViewer() {
    const { cid } = useParams()
    const navigate = useNavigate()
    const { data: memory, isLoading, error } = useMemory(cid || '')

    if (isLoading) return <Spinner color="#00ff00" />
    if (error) return <Text color="red.500">Error loading memory: {error.message}</Text>
    if (!memory) return <Text>No memory found</Text>

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardBody>
                    <HStack justify="space-between" mb={4}>
                        <HStack spacing={4}>
                            <Text fontSize="sm" color="gray.400">
                                Memory CID: <Text as="span" color="green.400">{cid}</Text>
                            </Text>
                            <Link
                                href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${cid}`}
                                isExternal
                                color="#00ff00"
                                display="flex"
                                alignItems="center"
                                gap={2}
                            >
                                View in Explorer <ExternalLinkIcon mx="2px" />
                            </Link>
                        </HStack>
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

                    {memory.workflowState?.decision && (
                        <>
                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Decision
                            </Text>
                            <VStack align="stretch" mb={4} pl={4}>
                                <Text>
                                    <Text as="span" color="gray.400">Should Engage:</Text>{' '}
                                    <Text as="span" color={memory.workflowState.decision.shouldEngage ? "green.400" : "red.400"}>
                                        {memory.workflowState.decision.shouldEngage ? "Yes" : "No"}
                                    </Text>
                                </Text>
                                <Text>
                                    <Text as="span" color="gray.400">Reason:</Text>{' '}
                                    <Text as="span" color="white">{memory.workflowState.decision.reason}</Text>
                                </Text>
                            </VStack>
                        </>
                    )}

                    {memory.type !== 'skipped' && (
                        <>
                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Response 
                            </Text>
                            <VStack align="stretch" mb={4} pl={4}>
                                <Text>
                                    <Text as="span" color="gray.400">Content:</Text>{' '}
                                    <Text as="span" color="white">{memory.response}</Text>
                                </Text>
                            </VStack>

                            {memory.type === 'rejected' && memory.workflowState?.autoFeedback && (
                                <>
                                    <Text fontSize="md" fontWeight="bold" color="red.400" mb={2}>
                                        Rejection Feedback
                                    </Text>
                                    <VStack align="stretch" mb={4} pl={4}>
                                        <Text>
                                            <Text as="span" color="gray.400">Reason:</Text>{' '}
                                            <Text as="span" color="red.400">{memory.workflowState.autoFeedback.reason}</Text>
                                        </Text>
                                        <Text>
                                            <Text as="span" color="gray.400">Suggested Changes:</Text>{' '}
                                            <Text as="span" color="yellow.400">{memory.workflowState.autoFeedback.suggestedChanges}</Text>
                                        </Text>
                                    </VStack>
                                </>
                            )}

                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Tone Analysis
                            </Text>
                            <VStack align="stretch" mb={4} pl={4}>
                                <Text>
                                    <Text as="span" color="gray.400">Dominant Tone:</Text>{' '}
                                    <Text as="span" color="orange.400">{memory.workflowState.toneAnalysis.dominantTone}</Text>
                                </Text>
                                <Text>
                                    <Text as="span" color="gray.400">Suggested Tone:</Text>{' '}
                                    <Text as="span" color="orange.400">{memory.workflowState.toneAnalysis.suggestedTone}</Text>
                                </Text>
                                <Text>
                                    <Text as="span" color="gray.400">Reasoning:</Text>{' '}
                                    <Text as="span" color="white">{memory.workflowState.toneAnalysis.reasoning}</Text>
                                </Text>
                               
                            </VStack>

                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Response Strategy
                            </Text>
                            <VStack align="stretch" mb={4} pl={4}>
                                <Text>
                                    <Text as="span" color="gray.400">Tone:</Text>{' '}
                                    <Text as="span" color="orange.400">{memory.workflowState.responseStrategy.tone}</Text>
                                </Text>
                                <Text>
                                    <Text as="span" color="gray.400">Strategy:</Text>{' '}
                                    <Text as="span" color="white">{memory.workflowState.responseStrategy.strategy}</Text>
                                </Text>
                                <Text>
                                    <Text as="span" color="gray.400">Confidence:</Text>{' '}
                                    <Text as="span" color="green.400">{(memory.workflowState.responseStrategy.confidence * 100).toFixed(1)}%</Text>
                                </Text>
                            </VStack>

                            {memory.workflowState.responseStrategy.referencedTweets.length > 0 && (
                                <>
                                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                        Referenced Tweets
                                    </Text>
                                    <VStack align="stretch" mb={4} pl={4}>
                                        {memory.workflowState.responseStrategy.referencedTweets.map((tweet, index) => (
                                            <Box 
                                                key={index} 
                                                p={2} 
                                                border="1px solid" 
                                                borderColor="gray.600" 
                                                borderRadius="md"
                                            >
                                                <Text color="white" mb={2}>{tweet.text}</Text>
                                                <Text fontSize="sm" color="gray.400">Reason: {tweet.reason}</Text>
                                                <Text fontSize="sm" color="gray.400">
                                                    Similarity: {(tweet.similarity_score * 100).toFixed(1)}%
                                                </Text>
                                            </Box>
                                        ))}
                                    </VStack>
                                </>
                            )}

                            {memory.mentions && memory.mentions.length > 0 && (
                                <>
                                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                        Conversation Thread
                                    </Text>
                                    <VStack align="stretch" mb={4} pl={4}>
                                        {memory.mentions.map((mention) => (
                                            <Box 
                                                key={mention.id} 
                                                p={2} 
                                                border="1px solid" 
                                                borderColor="gray.600" 
                                                borderRadius="md"
                                            >
                                                <Text>
                                                    <Text as="span" color="gray.400">@{mention.author_username}:</Text>{' '}
                                                    <Text as="span" color="white">{mention.text}</Text>
                                                </Text>
                                                <Text fontSize="sm" color="gray.400">
                                                    {new Date(mention.created_at).toLocaleString()}
                                                </Text>
                                            </Box>
                                        ))}
                                    </VStack>
                                </>
                            )}

                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Memory Status
                            </Text>
                            <VStack align="stretch" mb={4} pl={4}>
                                <Text>
                                    <Text as="span" color="gray.400">Type:</Text>{' '}
                                    <Text as="span" color={getStatusColor(memory.type as ResponseStatus)}>
                                        {memory.type.charAt(0).toUpperCase() + memory.type.slice(1)}
                                    </Text>
                                </Text>
                            </VStack>

                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Additional Information
                            </Text>
                            <VStack align="stretch" pl={4}>
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
                                    <Text as="span" color="gray.400">Timestamp:</Text>{' '}
                                    <Text as="span" color="white">{new Date(memory.timestamp).toLocaleString()}</Text>
                                </Text>
                            </VStack>

                            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                                Signature
                            </Text>
                            <VStack align="stretch" mb={4} pl={4}>
                                <Text>
                                    <Text as="span" color="gray.400">Value:</Text>{' '}
                                    <Text as="span" color="white" fontSize="sm" wordBreak="break-all">
                                        {memory.signature}
                                    </Text>
                                </Text>
                            </VStack>
                        </>
                    )}
                </CardBody>
            </Card>
            
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
        </VStack>
    )
}

export default MemoryViewer 