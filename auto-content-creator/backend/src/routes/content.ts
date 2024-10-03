import express from 'express';
import { generateContent } from '../services/contentService';
import { insertContent, getContentById, getAllContent } from '../database';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { category, topic, contentType, otherInstructions } = req.body;
    const result = await generateContent({ category, topic, contentType, otherInstructions });

    const id = insertContent(
      category,
      topic,
      contentType,
      result.finalContent,
      result.research,
      JSON.stringify(result.reflections),
      JSON.stringify(result.drafts)
    );

    res.json({ id, ...result });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const content = getContentById(id);
  if (content) {
    res.json(content);
  } else {
    res.status(404).json({ error: 'Content not found' });
  }
});

router.get('/', (req, res) => {
  const contents = getAllContent();
  res.json(contents);
});

export const contentRouter = router;
