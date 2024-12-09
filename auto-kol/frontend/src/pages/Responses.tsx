import { Box, Heading, Stack, Card, CardBody, Text, Button, ButtonGroup, Link } from '@chakra-ui/react'
import { usePendingResponses, approveResponse } from '../api/client'
import type { PendingResponse } from '../types'
import { ExternalLinkIcon } from '@chakra-ui/icons'

function Responses() {
    const { data: responses, isLoading, error } = usePendingResponses()

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
                ) : responses?.map((response: PendingResponse) => (
                    <Card key={response.id}>
                        <CardBody>
                            <Text fontWeight="bold" mb={2}>
                                @{response.tweet.author_username}
                            </Text>
                            <Link
                                href={`https://x.com/${response.tweet.author_username}/status/${response.tweet.id}`}
                                isExternal
                                color="blue.500"
                                display="flex"
                                alignItems="center"
                                gap={2}
                                mb={2}
                                _hover={{ color: 'blue.600', textDecoration: 'none' }}
                            >
                                View tweet on X <ExternalLinkIcon mx="2px" />
                            </Link>
                            <Text color="gray.600" mb={4}>
                                {response.tweet.text}
                            </Text>
                            <Text color="blue.600" mb={4}>
                                Response: {response.response.content}
                            </Text>
                            <ButtonGroup spacing={4}>
                                <Button colorScheme="green" onClick={() => approveResponse(response.id, true)}>
                                    Approve
                                </Button>
                                <Button colorScheme="red" onClick={() => approveResponse(response.id, false)}>
                                    Reject
                                </Button>
                            </ButtonGroup>
                        </CardBody>
                    </Card>
                ))}
            </Stack>
        </Box>
    )
}

export default Responses 