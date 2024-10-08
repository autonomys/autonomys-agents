import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initializeDatabase } from './database';
import { contentRouter } from './routes/content';

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 4000;

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Initialize the database
initializeDatabase();

// Use the content router
app.use('/api/content', contentRouter);

app.get('/', (req, res) => {
  console.log('Received request on root route');
  res.send('Auto Content Creator Backend is running!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
