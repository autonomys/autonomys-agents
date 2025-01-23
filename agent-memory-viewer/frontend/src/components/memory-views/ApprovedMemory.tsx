import { Text, VStack } from '@chakra-ui/react'
import { ApprovedMemory } from '../../types'
import { 
    MemoryStatus,
    AdditionalInfo,
    Signature,
    AgentVersion,
    ConversationThread 
} from './shared/CommonSections'
import { DecisionSection } from './shared/DecisionSection'
import { ResponseStrategySection } from './shared/ResponseStrategySection'

interface Props {
    memory: ApprovedMemory;
}

export function ApprovedMemoryView({ memory }: Props) {
    return (
        <>
            <DecisionSection decision={memory.workflowState.decision} />

            <Text fontSize="md" fontWeight="bold" color="green.400" mb={2}>
                Response (Approved)
            </Text>
            <VStack align="stretch" mb={4} pl={4}>
                <Text>
                    <Text as="span" color="gray.400">Content:</Text>{' '}
                    <Text as="span" color="white">{memory.response}</Text>
                </Text>
            </VStack>

            <ResponseStrategySection strategy={memory.workflowState.responseStrategy} />
            
            <MemoryStatus type={memory.type} />
            <AdditionalInfo 
                previousCid={memory.previousCid} 
                timestamp={memory.timestamp} 
            />
            <Signature value={memory.signature} />
            <AgentVersion version={memory.agentVersion} />
            <ConversationThread items={memory.mentions || memory.tweet?.thread} />
        </>
    );
} 