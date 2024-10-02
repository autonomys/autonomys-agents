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
    const { category, topic, contentType, otherInstructions } = req.body;

    if (!category || !topic || !contentType) {
      console.log('Category, topic, and contentType are required');
      return res.status(400).json({ error: 'Category, topic, and contentType are required' });
    }

    console.log('Calling writerAgent with parameters:', { category, topic, contentType, otherInstructions });
    const result = await writerAgent({ category, topic, contentType, otherInstructions });
    console.log('writerAgent result:', result);

    if (!result.finalContent || result.finalContent.trim() === '') {
      console.log('WriterAgent returned empty result');
      return res.status(500).json({ error: 'Failed to generate content' });
    }

    console.log('Sending response with generated content and additional information');
    res.json({
      finalContent: result.finalContent,
      research: result.research,
      reflections: result.reflections,
      drafts: result.drafts,
    });
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
