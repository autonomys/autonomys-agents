import React, { useState } from 'react';
import styled from 'styled-components';
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
`;

const ContentGenerator: React.FC = () => {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('');
  const [otherInstructions, setOtherInstructions] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Generating content...');
    setError(false);

    try {
      const result = await generateContent({ category, topic, contentType, otherInstructions });
      setStatus(`Content generated successfully! ID: ${result.id}`);
    } catch (error) {
      setStatus('Error generating content');
      setError(true);
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h2>Generate New Content</h2>
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
        <Button type='submit'>Generate Content</Button>
      </Form>
      {status && <StatusMessage error={error}>{status}</StatusMessage>}
    </div>
  );
};

export default ContentGenerator;
