export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `https://localhost:3010/api`;
export const API_TOKEN = process.env.REACT_APP_API_TOKEN || '';

export const DEFAULT_NAMESPACE = 'orchestrator';

export const getHeaders = (contentType = 'application/json') => {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  return headers;
};

export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = options.headers || getHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
