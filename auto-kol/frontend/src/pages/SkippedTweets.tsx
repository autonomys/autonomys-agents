import { Box, Heading, Stack, Card, CardBody, Text, Badge, Button, useToast } from '@chakra-ui/react'
import { useSkippedTweets, moveToQueue } from '../api/client'
import type { SkippedTweet } from '../types'

function SkippedTweets() {
    const { data: skippedTweets, isLoading, error, refetch } = useSkippedTweets()
    const toast = useToast()

    const handleMoveToQueue = async (tweet: SkippedTweet) => {
        try {
            await moveToQueue(tweet.id, tweet)
            // Refresh the list after successful move
            refetch()
            toast({
                title: 'Tweet moved to queue',
                description: 'Skipped tweet rechecked and moved to queue - it will be processed in next workflow run',
                status: 'success',
                duration: 5000,
                isClosable: true,
            })
        } catch (error) {
            console.error('Failed to move tweet to queue:', error)
            toast({
                title: 'Error',
                description: 'Failed to move tweet to queue',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        }
    }

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
                            <Text fontSize="sm" color="gray.500" mb={4}>
                                Reason: {tweet.reason}
                            </Text>
                            <Button 
                                colorScheme="blue" 
                                size="sm"
                                onClick={() => handleMoveToQueue(tweet)}
                            >
                                Move to Response
                            </Button>
                        </CardBody>
                    </Card>
                ))}
            </Stack>
        </Box>
    )
}

export default SkippedTweets 