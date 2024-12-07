import axios from 'axios'
import { useQuery } from 'react-query'
import type { PendingResponse, SkippedTweet } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add response interceptor for debugging
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
    }
)

export const usePendingResponses = () => {
    return useQuery<PendingResponse[], Error>('pendingResponses',
        async () => {
            const { data } = await api.get('/responses/pending')
            return data
        },
        {
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            onError: (error) => {
                console.error('Failed to fetch responses:', error)
            }
        }
    )
}

export const useSkippedTweets = () => {
    return useQuery<SkippedTweet[], Error>('skippedTweets', async () => {
        const { data } = await api.get('/tweets/skipped')
        console.log('Skipped tweets:', data)
        return data
    })
}

export const approveResponse = async (id: string, approved: boolean, feedback?: string) => {
    try {
        const { data } = await api.post(`/responses/${id}/approve`, { approved, feedback })
        return data
    } catch (error) {
        console.error('Failed to approve/reject response:', error)
        throw error
    }
}

export const moveToQueue = async (id: string, response: any) => {
    const { data } = await api.post(`/tweets/skipped/${id}/queue`, { response })
    return data
} 