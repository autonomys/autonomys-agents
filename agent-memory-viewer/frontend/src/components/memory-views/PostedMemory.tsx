import { PostedMemory } from '../../types';
import { 
    MemoryStatus,
    AdditionalInfo,
    Signature,
    AgentVersion
} from './shared/CommonSections';

interface Props {
    memory: PostedMemory;
}

export function PostedMemoryView({ memory }: Props) {
    return (
        <>
            <MemoryStatus type={memory.type} />
            <AdditionalInfo 
                previousCid={memory.previousCid} 
                timestamp={memory.timestamp} 
            />
            <Signature value={memory.signature} />
            <AgentVersion version={memory.agentVersion} />
        </>
    );
} 