import React, { useState } from 'react';
import styled from 'styled-components';
import { generateContent } from '../api/contentApi';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 10px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Generating content...');

    try {
      const result = await generateContent({ category, topic, contentType, otherInstructions });
      setStatus(`Content generated with ID: ${result.id}`);
    } catch (error) {
      setStatus('Error generating content');
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
        <Input
          type='text'
          value={otherInstructions}
          onChange={e => setOtherInstructions(e.target.value)}
          placeholder='Enter other instructions'
        />
        <Button type='submit'>Generate Content</Button>
      </Form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default ContentGenerator;
