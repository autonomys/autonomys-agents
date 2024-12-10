import { Card, CardBody, Text, Spinner, VStack, Link } from '@chakra-ui/react'
import { useDSNData } from '../api/client'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'

function DSNViewer() {
    const { data: dsnData, isLoading, error } = useDSNData()

    if (isLoading) return <Spinner color="#00ff00" />
    if (error) return <Text color="red.500">Error loading DSN data: {(error as Error).message}</Text>
    if (!dsnData || dsnData.length === 0) return <Text>No DSN data found</Text>

    return (
        <VStack spacing={4} align="stretch">
            {dsnData.map((item) => (
                <Card key={item.id}>
                    <CardBody>
                        <Text fontSize="sm" color="#00ff00" mb={2}>
                            Tweet by @{item.author_username}
                        </Text>
                        <Text whiteSpace="pre-wrap" mb={4}>
                            {item.tweet_content}
                        </Text>
                        
                        {item.result_type === 'skipped' ? (
                            <>
                                <Text fontSize="sm" color="yellow.500" mb={2}>
                                    Skipped: {item.skip_reason}
                                </Text>
                                <Link
                                    as={RouterLink}
                                    to={`/memory/${item.cid}`}
                                    color="#00ff00"
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                >
                                    View Memory <ExternalLinkIcon mx="2px" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Text fontSize="sm" color="#00ff00" mb={2}>
                                    Response:
                                </Text>
                                <Text whiteSpace="pre-wrap" mb={4}>
                                    {item.response_content}
                                </Text>
                                <Text fontSize="sm" color={item.response_status === 'pending' ? 'yellow.500' : '#00ff00'} mb={2}>
                                    Status: {item.response_status}
                                </Text>
                            </>
                        )}
                    </CardBody>
                </Card>
            ))}
        </VStack>
    )
}

export default DSNViewer 