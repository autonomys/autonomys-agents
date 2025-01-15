import { Text, VStack } from '@chakra-ui/react'

interface Feedback {
    reason: string;
    suggestedChanges: string;
}

interface Props {
    feedback: Feedback[];
}

export function RejectionFeedbackSection({ feedback }: Props) {
    if (!feedback || feedback.length === 0) return null;

    return (
        <>
            <Text fontSize="md" fontWeight="bold" color="red.400" mb={2}>
                Rejection Feedback
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                {feedback.map((item, index) => (
                    <VStack 
                        key={index}
                        align="stretch" 
                        p={2} 
                        border="1px solid" 
                        borderColor="gray.600" 
                        borderRadius="md"
                        mb={2}
                    >
                        <Text>
                            <Text as="span" color="gray.400">Reason:</Text>{' '}
                            <Text as="span" color="red.400">{item.reason}</Text>
                        </Text>
                        <Text>
                            <Text as="span" color="gray.400">Suggested Changes:</Text>{' '}
                            <Text as="span" color="yellow.400">{item.suggestedChanges}</Text>
                        </Text>
                    </VStack>
                ))}
            </VStack>
        </>
    );
} 