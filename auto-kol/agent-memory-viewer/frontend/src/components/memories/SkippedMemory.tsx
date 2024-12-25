import { Text, VStack, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { SkippedMemory } from '../../types'
import { ResponseStatus } from '../../types/enums'
import { getStatusColor } from '../../utils/statusColors'

interface Props {
    memory: SkippedMemory;
}

export function SkippedMemoryView({ memory }: Props) {
    const renderDecision = () => {
        const { decision } = memory.workflowState;
        return (
            <>
                <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                    Decision
                </Text>
                <VStack align="stretch" mb={4} pl={4}>
                    <Text>
                        <Text as="span" color="gray.400">Should Engage:</Text>{' '}
                        <Text as="span" color={decision.shouldEngage ? "green.400" : "red.400"}>
                            {decision.shouldEngage ? "Yes" : "No"}
                        </Text>
                    </Text>
                    <Text>
                        <Text as="span" color="gray.400">Reason:</Text>{' '}
                        <Text as="span" color="white">{decision.reason}</Text>
                    </Text>
                    <Text>
                        <Text as="span" color="gray.400">Priority:</Text>{' '}
                        <Text as="span" color="orange.400">{decision.priority}</Text>
                    </Text>
                    <Text>
                        <Text as="span" color="gray.400">Confidence:</Text>{' '}
                        <Text as="span" color="green.400">
                            {(decision.confidence * 100).toFixed(1)}%
                        </Text>
                    </Text>
                </VStack>
            </>
        );
    };

    return (
        <>
            {renderDecision()}
            
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Memory Status
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Type:</Text>{' '}
                    <Text as="span" color={getStatusColor(memory.type as ResponseStatus)}>
                        {memory.type.charAt(0).toUpperCase() + memory.type.slice(1)}
                    </Text>
                </Text>
            </VStack>

            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Additional Information
            </Text>
            <VStack align="stretch" pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Previous CID:</Text>{' '}
                    {memory.previousCid ? (
                        <Link
                            as={RouterLink}
                            to={`/memory/${memory.previousCid}`}
                            color="blue.400"
                            _hover={{ color: 'blue.300' }}
                        >
                            {memory.previousCid}
                        </Link>
                    ) : (
                        <Text as="span" color="white">None</Text>
                    )}
                </Text>
                <Text>
                    <Text as="span" color="gray.400">Timestamp:</Text>{' '}
                    <Text as="span" color="white">{new Date(memory.timestamp).toLocaleString()}</Text>
                </Text>
            </VStack>

            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Signature
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Value:</Text>{' '}
                    <Text as="span" color="white" fontSize="sm" wordBreak="break-all">
                        {memory.signature}
                    </Text>
                </Text>
            </VStack>

            {( (memory.mentions && memory.mentions.length > 0) || (memory.tweet?.thread && memory.tweet?.thread.length > 0)) && (
                <>
                    <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                        Conversation Thread
                    </Text>
                    <VStack align="stretch" mb={4} pl={4}>
                        {(memory.tweet?.thread || memory.mentions)?.map((item) => (
                            <VStack 
                                key={item.id} 
                                p={2} 
                                border="1px solid" 
                                borderColor="gray.600" 
                                borderRadius="md"
                                align="stretch"
                            >
                                <Text>
                                    <Text as="span" color="gray.400">
                                        @{item.author_username}:
                                    </Text>{' '}
                                    <Text as="span" color="white">{item.text}</Text>
                                </Text>
                                <Text fontSize="sm" color="gray.400">
                                    {new Date(item.created_at).toLocaleString()}
                                </Text>
                            </VStack>
                        ))}
                    </VStack>
                </>
            )}
        </>
    );
} 