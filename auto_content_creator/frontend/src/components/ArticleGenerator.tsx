import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface ArticleGeneratorProps {
  onArticleGenerated: (articleId: string) => void;
}

interface ArticleData {
  article_id: string;
  title: string;
  snippet: string;
}

const GeneratorContainer = styled.div`
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const GeneratorTitle = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
`;

const GeneratorForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TopicInput = styled.input`
  padding: 12px 15px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const GenerateButton = styled.button`
  padding: 12px 20px;
  font-size: 18px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StatusMessage = styled.p`
  color: #666;
  font-style: italic;
  margin-top: 15px;
`;

const ArticlePreview = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 20px;
  margin-top: 30px;
`;

const ViewDetailButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 15px;

  &:hover {
    background-color: #218838;
  }
`;

const ArticleGenerator: React.FC<ArticleGeneratorProps> = ({ onArticleGenerated }) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const navigate = useNavigate();

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
      setStatus(event.data);
    };

    eventSource.addEventListener('article_ready', event => {
      try {
        if (event.data && event.data.trim() !== '') {
          const parsedData: ArticleData = JSON.parse(event.data);
          setArticleData(parsedData);
          setStatus('Article generated successfully!');
        } else {
          setStatus('Article ready, but no data received');
        }
        setIsLoading(false);
        eventSource.close();
      } catch (error: any) {
        console.error('Error parsing article data:', error);
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
    <GeneratorContainer>
      <GeneratorTitle>Generate Article</GeneratorTitle>
      <GeneratorForm onSubmit={handleSubmit}>
        <TopicInput
          type='text'
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder='Enter article topic'
          required
        />
        <GenerateButton type='submit' disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Article'}
        </GenerateButton>
      </GeneratorForm>
      {status && <StatusMessage>{status}</StatusMessage>}
      {isLoading && <LoadingSpinner />}
      {articleData && (
        <ArticlePreview>
          <h3>{articleData.title}</h3>
          <ReactMarkdown>{articleData.snippet}</ReactMarkdown>
          <ViewDetailButton onClick={() => navigate(`/article/${articleData.article_id}`)}>
            View Full Article
          </ViewDetailButton>
        </ArticlePreview>
      )}
    </GeneratorContainer>
  );
};

export default ArticleGenerator;
