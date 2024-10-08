import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.FRONTEND_PORT || '5173', 10),
  },
  define: {
    'import.meta.env.VITE_BACKEND_SERVICE_URL': JSON.stringify(
      process.env.VITE_BACKEND_SERVICE_URL || 'http://localhost:4000'
    ),
  },
});
