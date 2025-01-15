import { Card, CardBody, Text, Spinner, VStack, HStack, Button, Link } from '@chakra-ui/react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { useMemory } from '../api/client'
import { TweetInfo } from '../components/memories/shared/TweetInfo'
import { SkippedMemoryView } from '../components/memories/SkippedMemory'
import { ApprovedMemoryView } from '../components/memories/ApprovedMemory'
import { RejectedMemoryView } from '../components/memories/RejectedMemory'
import { PostedMemoryView } from '../components/memories/PostedMemory'
import { ResponseStatus } from '../types/enums'

function MemoryViewer() {
    const { cid } = useParams()
    const navigate = useNavigate()
    const { data: memory, isLoading, error } = useMemory(cid || '')

    const explorerUrl = `https://astral.autonomys.xyz/taurus/permanent-storage/files/${cid}`

    if (isLoading) return <Spinner color="#00ff00" />
    if (error) return <Text color="red.500">Error loading memory: {error.message}</Text>
    if (!memory) return <Text>No memory found</Text>

    const renderMemoryContent = () => {
        switch (memory.type) {
            case ResponseStatus.SKIPPED:
                return <SkippedMemoryView memory={memory} />
            case ResponseStatus.APPROVED:
                return <ApprovedMemoryView memory={memory} />
            case ResponseStatus.REJECTED:
                return <RejectedMemoryView memory={memory} />
            case ResponseStatus.POSTED:
                return <PostedMemoryView memory={memory} />
            default:
                return <Text>Unknown memory type: {memory.type}</Text>
        }
    }

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardBody>
                    <HStack justify="space-between" mb={4}>
                        <Text fontSize="lg" fontWeight="bold" color="green.400">
                            Memory CID: {cid}
                        </Text>
                        <HStack spacing={4}>
                            <Link
                                href={explorerUrl}
                                isExternal
                                color="blue.400"
                                _hover={{ color: 'blue.300' }}
                            >
                                View in Explorer <ExternalLinkIcon mx="2px" />
                            </Link>
                            {memory.previousCid && (
                                <Link
                                    as={RouterLink}
                                    to={`/memory/${memory.previousCid}`}
                                    color="blue.400"
                                    _hover={{ color: 'blue.300' }}
                                >
                                    Previous CID
                                </Link>
                            )}
                        </HStack>
                    </HStack>

                    <TweetInfo tweet={memory.tweet} />
                    {renderMemoryContent()}
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