import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Form = styled.form`
  margin-top: 20px;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
  padding: 10px;
`;

const SubmitButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;

interface FeedbackFormProps {
  articleId: string;
  onFeedbackSubmitted: () => void;
}

function FeedbackForm({ articleId, onFeedbackSubmitted }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/submit-feedback', {
        article_id: articleId,
        feedback,
      });
      setFeedback('');
      onFeedbackSubmitted();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h3>Submit Feedback</h3>
      <TextArea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder='Enter your feedback here...'
        required
      />
      <SubmitButton type='submit'>Submit Feedback</SubmitButton>
    </Form>
  );
}

export default FeedbackForm;
