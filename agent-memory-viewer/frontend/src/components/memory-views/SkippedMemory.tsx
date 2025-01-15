import { SkippedMemory } from '../../types'
import { 
    MemoryStatus,
    AdditionalInfo,
    Signature,
    AgentVersion,
    ConversationThread 
} from './shared/CommonSections'
import { DecisionSection } from './shared/DecisionSection'

interface Props {
    memory: SkippedMemory;
}

export function SkippedMemoryView({ memory }: Props) {
    return (
        <>
            <DecisionSection decision={memory.workflowState.decision} />
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