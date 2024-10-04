import express from 'express';
import { generateContent } from '../services/contentService';
import { insertContent, getContentById, getAllContent } from '../database';
import { ContentGenerationParams, ContentGenerationOutput, ContentItem, ContentListResponse } from '../types';

const router = express.Router();

router.post('/generate', async (req, res) => {
  console.log('Received request to generate content:', req.body);
  try {
    const params: ContentGenerationParams = req.body;
    const result: ContentGenerationOutput = await generateContent(params);

    const id = insertContent(
      params.category,
      params.topic,
      params.contentType,
      result.finalContent,
      result.research,
      JSON.stringify(result.reflections),
      JSON.stringify(result.drafts)
    );
    console.log(`Content generated successfully with ID: ${id}`);
    res.json({ id, result });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`Received request to get content with ID: ${id}`);
  const content: ContentItem | undefined = getContentById(id);
  if (content) {
    console.log(`Content found for ID: ${id}`);
    res.json({
      ...content,
      reflections: JSON.stringify(content.reflections),
      drafts: JSON.stringify(content.drafts),
    });
  } else {
    console.log(`Content not found for ID: ${id}`);
    res.status(404).json({ error: 'Content not found' });
  }
});

router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  console.log(`Received request to get content list. Page: ${page}, Limit: ${limit}`);

  try {
    const { contents, total } = getAllContent(page, limit);
    const totalPages = Math.ceil(total / limit);

    console.log(`Returning ${contents.length} contents. Total items: ${total}`);
    const response: ContentListResponse = {
      contents,
      currentPage: page,
      totalPages,
      totalItems: total,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching contents:', error);
    res.status(500).json({ error: 'Failed to fetch contents' });
  }
});

export const contentRouter = router;
