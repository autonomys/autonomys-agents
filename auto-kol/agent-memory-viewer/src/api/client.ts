import axios from 'axios'
import { useQuery } from 'react-query'
import type { AgentMemory, DSNResponse } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const useMemory = (cid: string) => {
    return useQuery<AgentMemory, Error>(
        ['memory', cid],
        async () => {
            const { data } = await api.get(`/memories/${cid}`)
            return data
        },
        {
            enabled: !!cid,
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        }
    )
}

export const useLatestMemory = (agentId: string) => {
    return useQuery<AgentMemory, Error>(
        ['latestMemory', agentId],
        async () => {
            const { data } = await api.get(`/agents/${agentId}/memories/latest`)
            return data
        },
        {
            enabled: !!agentId,
        }
    )
}

export const useDSNData = (page: number = 1, limit: number = 10) => {
    return useQuery<DSNResponse, Error>(
        ['dsn', page, limit],
        async () => {
            const { data } = await api.get(`/memories?page=${page}&limit=${limit}`);
            return data;
        },
        {
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            keepPreviousData: true,
        }
    );
}


