import axios from 'axios';
import dotenv from 'dotenv';
import { ContentGenerationParams, ContentGenerationOutput } from '../types';

dotenv.config();

const AGENTS_SERVICE_URL = process.env.AGENTS_SERVICE_URL || 'http://localhost:3000';

export const generateContent = async (params: ContentGenerationParams): Promise<ContentGenerationOutput> => {
  try {
    const response = await axios.post<ContentGenerationOutput>(`${AGENTS_SERVICE_URL}/writer`, params);
    return response.data;
  } catch (error) {
    console.error('Error calling writer agent:', error);
    throw new Error('Failed to generate content');
  }
};
