import { Box, Heading, Stack, Card, CardBody, Text, Button, ButtonGroup, Link, useToast } from '@chakra-ui/react'
import { usePendingResponses, approveResponse } from '../api/client'
import type { PendingResponse } from '../types'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'

type ProcessingState = {
    id: string;
    action: 'approve' | 'reject';
} | null;

function Responses() {
    const { data: responses, isLoading, error } = usePendingResponses()
    const [localResponses, setLocalResponses] = useState<PendingResponse[]>([])
    const [processing, setProcessing] = useState<ProcessingState>(null)
    const toast = useToast()

    useEffect(() => {
        if (responses !== undefined) {
            setLocalResponses(responses || [])
        }
    }, [responses])

    const handleResponse = async (id: string, approved: boolean) => {
        setProcessing({ id, action: approved ? 'approve' : 'reject' })

        try {
            const apiCall = approveResponse(id, approved)

            await Promise.all([
                apiCall,
                new Promise(resolve => setTimeout(resolve, 700))
            ])

            setLocalResponses(prev => prev.filter(r => r.id !== id))

            toast({
                title: approved ? 'Response Approved' : 'Response Rejected',
                status: 'success',
                duration: 2000,
            })
        } catch (error) {
            toast({
                title: 'Error processing response',
                status: 'error',
                duration: 2000,
            })
        }
        setProcessing(null)
    }

    return (
        <Box>
            <Heading mb={6}>Pending Responses</Heading>
            {error && (
                <Text color="red.500" mb={4}>
                    Error loading responses: {(error as Error).message}
                </Text>
            )}
            <Stack spacing={4}>
                {isLoading ? (
                    <Text>Loading...</Text>
                ) : localResponses.length === 0 ? (
                    <Card>
                        <CardBody>
                            <Text
                                textAlign="center"
                                fontSize="lg"
                                color="gray.500"
                            >
                                No pending responses to review! 🎉
                            </Text>
                        </CardBody>
                    </Card>
                ) : (
                    localResponses.map((response: PendingResponse) => (
                        <Card key={response.id}>
                            <CardBody>
                                <Text
                                    fontWeight="bold"
                                    mb={2}
                                    fontSize="lg"
                                    color="#00ff00"
                                >
                                    @{response.tweet.author_username}
                                </Text>
                                <Link
                                    href={`https://x.com/${response.tweet.author_username}/status/${response.tweet.id}`}
                                    isExternal
                                    color="#4a9eff"
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                    mb={3}
                                    _hover={{ color: '#66b2ff', textDecoration: 'none' }}
                                >
                                    View tweet on X <ExternalLinkIcon mx="2px" />
                                </Link>
                                <Box
                                    bg="#001800"
                                    p={3}
                                    borderRadius="md"
                                    mb={4}
                                    border="1px solid #00ff00"
                                >
                                    <Text color="#00ff00" fontSize="md">
                                        {response.tweet.text}
                                    </Text>
                                </Box>
                                <Box
                                    bg="#000030"
                                    p={3}
                                    borderRadius="md"
                                    mb={4}
                                    border="1px solid #4a9eff"
                                >
                                    <Text
                                        color="#4a9eff"
                                        fontSize="md"
                                        fontWeight="500"
                                    >
                                        Response: {response.response.content}
                                    </Text>
                                </Box>
                                <ButtonGroup spacing={4}>
                                    <Button
                                        colorScheme="green"
                                        variant="solid"
                                        bg="#006400"
                                        _hover={{ bg: '#008000' }}
                                        onClick={() => handleResponse(response.id, true)}
                                        isLoading={processing?.id === response.id && processing.action === 'approve'}
                                        loadingText="Approving..."
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        colorScheme="red"
                                        variant="solid"
                                        bg="#8b0000"
                                        _hover={{ bg: '#a00000' }}
                                        onClick={() => handleResponse(response.id, false)}
                                        isLoading={processing?.id === response.id && processing.action === 'reject'}
                                        loadingText="Rejecting..."
                                    >
                                        Reject
                                    </Button>
                                </ButtonGroup>
                            </CardBody>
                        </Card>
                    ))
                )}
            </Stack>
        </Box>
    )
}

export default Responses 