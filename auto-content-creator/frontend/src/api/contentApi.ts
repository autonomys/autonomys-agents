/// <reference types="vite/client" />

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_SERVICE_URL || 'http://localhost:4000';
console.log(`VITE_BACKEND_SERVICE_URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const generateContent = async (contentData: {
  category: string;
  topic: string;
  contentType: string;
  otherInstructions: string;
}) => {
  const response = await api.post('/api/content/generate', contentData);
  return response.data;
};

export const getContentList = async (page: number = 1, limit: number = 10) => {
  console.log(`Fetching content list. Page: ${page}, Limit: ${limit}`);
  const response = await api.get(`/api/content?page=${page}&limit=${limit}`);
  return response.data;
};

export const getContentById = async (id: string) => {
  const response = await api.get(`/api/content/${id}`);
  return response.data;
};
