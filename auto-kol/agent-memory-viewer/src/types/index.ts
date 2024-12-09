export interface AgentMemory {
    cid: string
    previousCid: string | null
    content: string
    timestamp: string
    transactionHash: string
    agentId: string
}

export interface Agent {
    id: string
    name: string
    profileUrl: string
} 