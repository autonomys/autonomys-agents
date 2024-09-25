import express, { Request, Response } from 'express';
import { writerAgent } from './writerAgent';

// Create an Express application
const app = express();

// Add JSON parsing middleware
app.use(express.json());

// Specify the port number for the server
const port: number = 3000;

app.post('/writer', async (req: Request, res: Response) => {
  console.log('Received request body:', req.body);
  try {
    const { instructions } = req.body;

    if (!instructions) {
      console.log('Instructions missing from request body');
      return res.status(400).json({ error: 'Instructions are required' });
    }

    console.log('Calling writerAgent with instructions:', instructions);
    const result = await writerAgent(instructions);
    console.log('writerAgent result:', result);
    res.json({ result });
  } catch (error) {
    console.error('Error in /writer endpoint:', error);
    res.status(500).json({
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start the server and listen on the specified port
app.listen(port, () => {
  // Log a message when the server is successfully running
  console.log(`Server is running on http://localhost:${port}`);
});
