/// <reference types="react-scripts" />

declare global {
  interface Window {
    runtimeConfig?: {
      API_BASE_URL?: string;
      API_TOKEN?: string;
    };
  }
}
