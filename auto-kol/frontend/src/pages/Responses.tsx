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
                                >
                                    Approve
                                </Button>
                                <Button
                                    colorScheme="red"
                                    variant="solid"
                                    bg="#8b0000"
                                    _hover={{ bg: '#a00000' }}
                                >
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