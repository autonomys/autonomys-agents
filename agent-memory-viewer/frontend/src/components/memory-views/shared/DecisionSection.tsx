import { Text, VStack } from '@chakra-ui/react'

interface Decision {
    shouldEngage: boolean;
    reason: string;
    priority?: number;
    confidence?: number;
}

interface Props {
    decision: Decision;
}

export function DecisionSection({ decision }: Props) {
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
                {decision.priority && (
                    <Text>
                        <Text as="span" color="gray.400">Priority:</Text>{' '}
                        <Text as="span" color="orange.400">{decision.priority}</Text>
                    </Text>
                )}
                {decision.confidence && (
                    <Text>
                        <Text as="span" color="gray.400">Confidence:</Text>{' '}
                        <Text as="span" color="green.400">
                            {(decision.confidence * 100).toFixed(1)}%
                        </Text>
                    </Text>
                )}
            </VStack>
        </>
    );
} 