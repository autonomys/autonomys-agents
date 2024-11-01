/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const sendMessage = async (message: string, threadId?: string | null) => {
    try {
        const response = await axios.post(`${API_URL}/chainagent`, {
            message,
            threadId
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getThreadState = async (threadId: string) => {
    try {
        const response = await axios.get(`${API_URL}/chainagent/${threadId}/state`);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}; 