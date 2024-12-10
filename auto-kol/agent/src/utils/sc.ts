import { Address, createPublicClient, createWalletClient, Hash, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { MEMORY_ABI } from '../abi/memory.js';
import { config } from '../config/index.js';

const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS as `0x${string}`;

export const client = createPublicClient({
    chain: {
        ...mainnet,
        rpcUrls: {
            default: { http: [config.RPC_URL as `https://${string}`] },
            public: { http: [config.RPC_URL as `https://${string}`] },
        }
    },
    transport: http()
});

const account = privateKeyToAccount(config.PRIVATE_KEY as `0x${string}`)
const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
})

export async function getLastMemoryHash(agentAddress: Address): Promise<Hash> {
    return await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: MEMORY_ABI,
        functionName: 'getLastMemoryHash',
        args: [agentAddress]
    })
}

export async function setLastMemoryHash(hash: Hash) {
    const { request } = await client.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: MEMORY_ABI,
        functionName: 'setLastMemoryHash',
        args: [hash],
        account
    })
    
    return await walletClient.writeContract(request)
}

export function watchMemoryHashUpdates(
    agentAddress: Address,
    callback: (agent: Address, hash: Hash) => void
) {
    return client.watchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: MEMORY_ABI,
        eventName: 'LastMemoryHashSet',
        onLogs: (logs) => {
            logs.forEach((log) => {
                const [agent, hash] = log.args as [Address, Hash]
                if (agent === agentAddress) {
                    callback(agent, hash)
                }
            })
        }
    })
}

export async function signMessage(data: object): Promise<`0x${string}`> {
    const message = JSON.stringify(data)
    const signature = await walletClient.signMessage({
        account,
        message
    })

    return signature
}