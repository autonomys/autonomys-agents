import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { generateContent } from '../api/contentApi';

interface StatusMessageProps {
  error?: boolean;
}

const StatusMessage = styled.p<StatusMessageProps>`
  font-weight: bold;
  color: ${props => (props.error ? '#dc3545' : '#28a745')};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-height: 100px;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h2`
  text-align: left;
  margin-bottom: 20px;
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingIndicator = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
  margin-right: 10px;
`;

const GeneratedContentLink = styled(Link)`
  display: inline-block;
  margin-top: 20px;
  width: 90%;
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
  text-align: center; // Center the text

  &:hover {
    background-color: #218838;
  }
`;

const CheckboxContainer = styled.div`
  margin-top: 10px;
`;

const ContentGenerator: React.FC = () => {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('');
  const [otherInstructions, setOtherInstructions] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContentId, setGeneratedContentId] = useState<number | null>(null);
  const [autoRedirect, setAutoRedirect] = useState(() => {
    const saved = localStorage.getItem('autoRedirect');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('autoRedirect', JSON.stringify(autoRedirect));
  }, [autoRedirect]);

  const generationMessages = [
    'Brewing a pot of creative ideas...',
    'Channeling the muses for inspiration...',
    'Crafting words into digital art...',
    'Weaving a tapestry of engaging content...',
    'Polishing phrases to perfection...',
    'Sprinkling magic dust on your content...',
    'Assembling a masterpiece just for you...',
    'Putting the finishing touches on your creation...',
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % generationMessages.length);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError(false);
    setIsGenerating(true);
    setGeneratedContentId(null);

    try {
      const result = await generateContent({ category, topic, contentType, otherInstructions });
      setGeneratedContentId(result.id);
      setStatus('Content generated successfully!');
      if (autoRedirect) {
        window.location.href = `/content/${result.id}`;
      }
    } catch (error) {
      setStatus('Error generating content');
      setError(true);
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container>
      <Title>Generate New Content</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type='text'
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder='Enter category'
          required
        />
        <Input type='text' value={topic} onChange={e => setTopic(e.target.value)} placeholder='Enter topic' required />
        <Input
          type='text'
          value={contentType}
          onChange={e => setContentType(e.target.value)}
          placeholder='Enter content type'
          required
        />
        <TextArea
          value={otherInstructions}
          onChange={e => setOtherInstructions(e.target.value)}
          placeholder='Enter other instructions (optional)'
        />
        <Button type='submit' disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </Button>
      </Form>
      {isGenerating && (
        <StatusMessage>
          <LoadingIndicator />
          {generationMessages[currentMessageIndex]}
        </StatusMessage>
      )}
      {status && <StatusMessage error={error}>{status}</StatusMessage>}
      {generatedContentId && !autoRedirect && (
        <GeneratedContentLink to={`/content/${generatedContentId}`}>
          View Your Freshly Generated Content!
        </GeneratedContentLink>
      )}
      <CheckboxContainer>
        <label>
          <input
            type="checkbox"
            checked={autoRedirect}
            onChange={() => setAutoRedirect(!autoRedirect)}
          />
          Automatically redirect to generated content
        </label>
      </CheckboxContainer>
    </Container>
  );
};

export default ContentGenerator;
