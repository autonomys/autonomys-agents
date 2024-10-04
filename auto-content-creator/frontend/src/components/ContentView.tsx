import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { getContentById } from '../api/contentApi';

const ContentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const ContentText = styled.div`
  white-space: pre-wrap;
`;

interface Content {
  id: string;
  title: string;
  finalContent: string;
  fact_check_report: string;
  research_info: string;
  createdAt: string;
}

const ContentView: React.FC = () => {
  const [content, setContent] = useState<Content | null>(null);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (id) {
          const data = await getContentById(id);
          setContent(data);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };

    fetchContent();
  }, [id]);

  if (!content) {
    return <div>Loading...</div>;
  }

  return (
    <ContentContainer>
      <h2>{content.title}</h2>
      <p>Created at: {new Date(content.createdAt).toLocaleString()}</p>
      <h3>Content</h3>
      <ContentText>{content.finalContent}</ContentText>
      <h3>Fact Check Report</h3>
      <ContentText>{content.fact_check_report}</ContentText>
      <h3>Research Information</h3>
      <ContentText>{content.research_info}</ContentText>
    </ContentContainer>
  );
};

export default ContentView;
