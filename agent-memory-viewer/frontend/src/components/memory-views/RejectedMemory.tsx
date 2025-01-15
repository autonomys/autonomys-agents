import { Text, VStack } from '@chakra-ui/react'
import { RejectedMemory } from '../../types'
import { 
    MemoryStatus,
    AdditionalInfo,
    Signature,
    AgentVersion,
    ConversationThread 
} from './shared/CommonSections'
import { DecisionSection } from './shared/DecisionSection'
import { ResponseStrategySection } from './shared/ResponseStrategySection'
import { RejectionFeedbackSection } from './shared/RejectionFeedbackSection'

interface Props {
    memory: RejectedMemory;
}

export function RejectedMemoryView({ memory }: Props) {
    return (
        <>
            <DecisionSection decision={memory.workflowState.decision} />

            <Text fontSize="md" fontWeight="bold" color="red.400" mb={2}>
                Response (Rejected)
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Content:</Text>{' '}
                    <Text as="span" color="white">{memory.response}</Text>
                </Text>
                <Text>
                    <Text as="span" color="gray.400">Retry Count:</Text>{' '}
                    <Text as="span" color="orange.400">{memory.retry}</Text>
                </Text>
            </VStack>

            <RejectionFeedbackSection feedback={memory.workflowState.autoFeedback} />
            <ResponseStrategySection strategy={memory.workflowState.responseStrategy} />
            <MemoryStatus type={memory.type} />
            <AdditionalInfo 
                previousCid={memory.previousCid} 
                timestamp={memory.timestamp} 
            />
            <Signature value={memory.signature} />
            <AgentVersion version={memory.agentVersion} />
            <ConversationThread items={memory.mentions} />
        </>
    );
}