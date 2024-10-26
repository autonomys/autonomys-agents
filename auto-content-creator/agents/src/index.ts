import express, { Request, Response, NextFunction } from 'express';
import { writerAgent } from './writerAgent';
import dotenv from 'dotenv';

dotenv.config();

// Create an Express application
const app = express();

// Add JSON parsing middleware
app.use(express.json());

// Specify the port number for the server
const port: number = process.env.AGENTS_PORT ? parseInt(process.env.AGENTS_PORT) : 3000;

// Add this new endpoint for feedback
app.post('/writer/:threadId/feedback', (req: Request, res: Response, next: NextFunction) => {
  console.log('Received feedback request:', req.body);
  (async () => {
    try {
      const { feedback } = req.body;
      const threadId = req.params.threadId;

      if (!feedback) {
        return res.status(400).json({ error: 'Feedback is required' });
      }

      console.log('Processing feedback for thread:', threadId);

      const result = await writerAgent.continueDraft({
        threadId,
        feedback,
      });

      // Only return the latest content
      res.json({
        threadId,
        content: result.finalContent
      });
    } catch (error) {
      console.error('Error in feedback endpoint:', error);
      next(error);
    }
  })();
});

// Modify the original /writer endpoint to return threadId
app.post('/writer', (req: Request, res: Response, next: NextFunction) => {
  console.log('Received request body:', req.body);
  (async () => {
    try {
      const { category, topic, contentType, otherInstructions } = req.body;

      if (!category || !topic || !contentType) {
        console.log('Category, topic, and contentType are required');
        return res.status(400).json({ error: 'Category, topic, and contentType are required' });
      }

      const result = await writerAgent.startDraft({
        category,
        topic,
        contentType,
        otherInstructions,
      });

      res.json({
        threadId: result.threadId,
        finalContent: result.finalContent,
        research: result.research,
        reflections: result.reflections,
        drafts: result.drafts,
        feedbackHistory: result.feedbackHistory,
      });
    } catch (error) {
      console.error('Error in /writer endpoint:', error);
      next(error);
    }
  })();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'An error occurred while processing your request',
    details: err.message,
  });
});

// Add a simple route for testing
app.get('/', (req, res) => {
  console.log('Received request on root route');
  res.send('Auto Content Creator Backend is running!');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  // Log a message when the server is successfully running
  console.log(`Server is running on http://localhost:${port}`);
});
