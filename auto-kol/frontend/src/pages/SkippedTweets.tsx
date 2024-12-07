import { Box, Heading, Stack, Card, CardBody, Text, Badge } from '@chakra-ui/react'
import { useSkippedTweets } from '../api/client'
import type { SkippedTweet } from '../types'

function SkippedTweets() {
    const { data: skippedTweets, isLoading, error } = useSkippedTweets()

    return (
        <Box>
            <Heading mb={6}>Skipped Tweets</Heading>
            {error && (
                <Text color="red.500" mb={4}>
                    Error loading tweets: {(error as Error).message}
                </Text>
            )}
            <Stack spacing={4}>
                {isLoading ? (
                    <Text>Loading...</Text>
                ) : skippedTweets?.map((tweet: SkippedTweet) => (
                    <Card key={tweet.id}>
                        <CardBody>
                            <Text fontWeight="bold" mb={2}>
                                @{tweet.tweet.authorUsername}
                            </Text>
                            <Text color="gray.600" mb={4}>
                                {tweet.tweet.text}
                            </Text>
                            <Badge colorScheme="yellow" mb={2}>
                                Priority: {tweet.priority}
                            </Badge>
                            <Text fontSize="sm" color="gray.500">
                                Reason: {tweet.reason}
                            </Text>
                        </CardBody>
                    </Card>
                ))}
            </Stack>
        </Box>
    )
}

export default SkippedTweets 