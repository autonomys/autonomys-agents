import { Text, VStack, Link } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Tweet } from '../../../types'

interface Props {
    tweet: Tweet;
}

export function TweetInfo({ tweet }: Props) {
    const tweetUrl = `https://twitter.com/${tweet.author_username}/status/${tweet.id}`

    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Tweet Information
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">ID:</Text>{' '}
                    <Link
                        href={tweetUrl}
                        isExternal
                        color="blue.400"
                        _hover={{ color: 'blue.300' }}
                    >
                        {tweet.id} <ExternalLinkIcon mx="2px" />
                    </Link>
                </Text>
                <Text>
                    <Text as="span" color="gray.400">Author:</Text>{' '}
                    <Link
                        href={`https://twitter.com/${tweet.author_username}`}
                        isExternal
                        color="blue.400"
                        _hover={{ color: 'blue.300' }}
                    >
                        @{tweet.author_username} <ExternalLinkIcon mx="2px" />
                    </Link>
                </Text>
                <Text>
                    <Text as="span" color="gray.400">Created At:</Text>{' '}
                    <Text as="span" color="white">{new Date(tweet.created_at).toLocaleString()}</Text>
                </Text>
                <Text>
                    <Text as="span" color="gray.400">Content:</Text>{' '}
                    <Text as="span" color="white">{tweet.text}</Text>
                </Text>
            </VStack>
        </>
    )
} 