const runtimeConfig = typeof window !== 'undefined' ? (window as any).runtimeConfig || {} : {};

let determinedApiBaseUrl: string;

if (runtimeConfig.API_BASE_URL && runtimeConfig.API_BASE_URL !== 'your_api_url_here') {
  determinedApiBaseUrl = runtimeConfig.API_BASE_URL;
}
else if (process.env.REACT_APP_API_BASE_URL) {
  determinedApiBaseUrl = process.env.REACT_APP_API_BASE_URL;
}
else {
  determinedApiBaseUrl = 'https://localhost:3010/api';
}

let determinedApiToken: string;

if (runtimeConfig.API_TOKEN && runtimeConfig.API_TOKEN !== 'your_api_token_here') {
  determinedApiToken = runtimeConfig.API_TOKEN;
}
else if (process.env.REACT_APP_API_TOKEN) {
  determinedApiToken = process.env.REACT_APP_API_TOKEN;
}
else {
  determinedApiToken = '';
}

export const API_BASE_URL = determinedApiBaseUrl;
export const API_TOKEN = determinedApiToken;

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
