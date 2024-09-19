import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ArticleGeneratorProps {
  onArticleGenerated: (articleId: string) => void;
}

interface ArticleData {
  article_id: string;
  article_content: string;
  fact_check_report: string;
  research_info: string;
  final_article_content: string;
  files: {
    article: string;
    fact_check: string;
    research: string;
    final_article: string;
  };
}

const ArticleGenerator: React.FC<ArticleGeneratorProps> = ({ onArticleGenerated }) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [articleData, setArticleData] = useState<ArticleData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Initiating article generation...');
    setArticleData(null);

    try {
      const response = await axios.post(
        'http://localhost:8000/generate-article',
        { topic },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Response from server:', response.data);
      const articleId = response.data.article_id;
      onArticleGenerated(articleId);
      listenForUpdates(articleId);
    } catch (error: any) {
      console.error('Error generating article:', error);
      setStatus(`Error generating article: ${error.message}`);
      setIsLoading(false);
    }
  };

  const listenForUpdates = (articleId: string) => {
    const eventSource = new EventSource(`http://localhost:8000/article-status/${articleId}`);

    eventSource.onmessage = event => {
      console.log('Received message:', event.data);
      setStatus(event.data);
    };

    eventSource.addEventListener('article_ready', event => {
      console.log('Article ready event received. Raw data:', event.data);
      try {
        if (event.data && event.data.trim() !== '') {
          const parsedData: ArticleData = JSON.parse(event.data);
          console.log('Parsed article data:', parsedData);
          setArticleData(parsedData);
          setStatus('Article generated successfully!');
        } else {
          console.warn('Received empty data for article_ready event');
          setStatus('Article ready, but no data received');
        }
        setIsLoading(false);
        eventSource.close();
      } catch (error: any) {
        console.error('Error parsing article data:', error);
        console.error('Raw data causing the error:', event.data);
        setStatus(`Error processing article data: ${error.message}`);
        setIsLoading(false);
        eventSource.close();
      }
    });

    eventSource.onerror = error => {
      console.error('EventSource error:', error);
      setStatus('Error connecting to server. Please try again.');
      setIsLoading(false);
      eventSource.close();
    };
  };

  return (
    <div>
      <h2>Generate Article</h2>
      <form onSubmit={handleSubmit}>
        <input
          type='text'
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder='Enter article topic'
          required
        />
        <button type='submit' disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Article'}
        </button>
      </form>
      {status && <p>{status}</p>}
      {articleData && (
        <div>
          <h3>Generated Article</h3>
          <h4>Final Article Content:</h4>
          <pre>{articleData.final_article_content}</pre>
          <h4>Fact Check Report:</h4>
          <pre>{articleData.fact_check_report}</pre>
          <h4>Research Info:</h4>
          <pre>{articleData.research_info}</pre>
          <h4>File Locations:</h4>
          <ul>
            {Object.entries(articleData.files).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ArticleGenerator;
