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
                                @{tweet.author_username}
                            </Text>
                            <Text color="#00ff00" mb={4}>
                                {tweet.tweet_content}
                            </Text>
                            <Badge colorScheme="yellow" mb={2}>
                                Confidence: {tweet.confidence}
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