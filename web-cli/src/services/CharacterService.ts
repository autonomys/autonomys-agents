import { apiRequest } from './Api';

export const getCharacterName = async () => {
  const response = await apiRequest<{ character: string }>('/character/name');
  return response.character;
};
