import { Text, VStack, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PostedMemory } from '../../types';
import { getStatusColor } from '../../utils/statusColors';
import { ResponseStatus } from '../../types/enums';

interface Props {
    memory: PostedMemory;
}

export function PostedMemoryView({ memory }: Props) {
    return (
        <>
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
        </>
    );
} 