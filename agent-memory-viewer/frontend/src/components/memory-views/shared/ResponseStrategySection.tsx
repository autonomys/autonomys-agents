import { Text, VStack, Box } from '@chakra-ui/react'

interface ReferencedTweet {
    text: string;
    reason: string;
    similarity_score: number;
}

interface ResponseStrategy {
    tone?: string;
    strategy: string;
    confidence?: number;
    referencedTweets: ReferencedTweet[];
}

interface Props {
    strategy: ResponseStrategy;
}

export function ResponseStrategySection({ strategy }: Props) {
    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Response Strategy
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                {strategy.tone && (
                    <Text>
                        <Text as="span" color="gray.400">Tone:</Text>{' '}
                        <Text as="span" color="orange.400">{strategy.tone}</Text>
                    </Text>
                )}
                <Text>
                    <Text as="span" color="gray.400">Strategy:</Text>{' '}
                    <Text as="span" color="white">{strategy.strategy}</Text>
                </Text>
                {strategy.confidence && (
                    <Text>
                        <Text as="span" color="gray.400">Confidence:</Text>{' '}
                        <Text as="span" color="green.400">
                            {(strategy.confidence * 100).toFixed(1)}%
                        </Text>
                    </Text>
                )}
            </VStack>

            {strategy.referencedTweets.length > 0 && (
                <>
                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                        Referenced Tweets
                    </Text>
                    <VStack align="stretch" mb={4} pl={4}>
                        {strategy.referencedTweets.map((tweet, index) => (
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
        </>
    );
} 