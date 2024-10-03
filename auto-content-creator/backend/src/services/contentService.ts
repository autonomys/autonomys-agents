import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AGENTS_SERVICE_URL = process.env.AGENTS_SERVICE_URL || 'http://localhost:3000';

interface ContentGenerationParams {
  category: string;
  topic: string;
  contentType: string;
  otherInstructions: string;
}

export const generateContent = async (params: ContentGenerationParams): Promise<any> => {
  try {
    const response = await axios.post(`${AGENTS_SERVICE_URL}/writer`, params);
    return response.data;
  } catch (error) {
    console.error('Error calling writer agent:', error);
    throw new Error('Failed to generate content');
  }
};
