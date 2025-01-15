import { Text, VStack, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ResponseStatus } from '../../../types/enums'
import { getStatusColor } from '../../../utils/statusColors'

interface MemoryStatusProps {
    type: string;
}

export function MemoryStatus({ type }: MemoryStatusProps) {
    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Memory Status
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Type:</Text>{' '}
                    <Text as="span" color={getStatusColor(type as ResponseStatus)}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                </Text>
            </VStack>
        </>
    )
}

interface AdditionalInfoProps {
    previousCid: string | null;
    timestamp: string;
}

export function AdditionalInfo({ previousCid, timestamp }: AdditionalInfoProps) {
    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Additional Information
            </Text>
            <VStack align="stretch" pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Previous CID:</Text>{' '}
                    {previousCid ? (
                        <Link
                            as={RouterLink}
                            to={`/memory/${previousCid}`}
                            color="blue.400"
                            _hover={{ color: 'blue.300' }}
                        >
                            {previousCid}
                        </Link>
                    ) : (
                        <Text as="span" color="white">None</Text>
                    )}
                </Text>
                <Text>
                    <Text as="span" color="gray.400">Timestamp:</Text>{' '}
                    <Text as="span" color="white">{new Date(timestamp).toLocaleString()}</Text>
                </Text>
            </VStack>
        </>
    )
}

interface SignatureProps {
    value: string;
}

export function Signature({ value }: SignatureProps) {
    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Signature
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Value:</Text>{' '}
                    <Text as="span" color="white" fontSize="sm" wordBreak="break-all">
                        {value}
                    </Text>
                </Text>
            </VStack>
        </>
    )
}

interface AgentVersionProps {
    version?: string;
}

export function AgentVersion({ version }: AgentVersionProps) {
    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Agent Version
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Version:</Text>{' '}
                    <Text as="span" color="white">{version || '1.0.0'}</Text>
                </Text>
            </VStack>
        </>
    )
}

interface ThreadItem {
    id: string;
    author_username: string;
    text: string;
    created_at: string;
}

interface ConversationThreadProps {
    items?: ThreadItem[];
}

export function ConversationThread({ items }: ConversationThreadProps) {
    if (!items || items.length === 0) return null;
    
    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="purple.400" mb={2}>
                Conversation Thread
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                {items.map((item) => (
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
    )
} 