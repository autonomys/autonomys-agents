import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { getContentById } from '../api/contentApi';

interface ScoreProps {
  score: number;
}

const ScoreSpan = styled.span<ScoreProps>`
  font-weight: bold;
  color: ${props => (props.score > 7 ? '#28a745' : props.score > 5 ? '#ffc107' : '#dc3545')};
`;

const ContentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ContentHeader = styled.h2`
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
`;

const ContentSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #007bff;
`;

const ContentText = styled.div`
  white-space: pre-wrap;
  background-color: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const MetaInfo = styled.p`
  color: #666;
  font-style: italic;
`;

const ReflectionItem = styled.div`
  background-color: #e9ecef;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
`;

const DraftSelector = styled.select`
  width: 100%;
  padding: 5px;
  margin-bottom: 10px;
`;

interface Content {
  id: number;
  category: string;
  topic: string;
  contentType: string;
  finalContent: string;
  research: string;
  reflections: Array<{ critique: string; score: number }>;
  drafts: string[];
  createdAt: string;
}

function ensureArray<T>(data: T | T[] | string | null | undefined): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'string') {
        // Handle double-encoded JSON
        return JSON.parse(parsed);
      } else {
        return [parsed];
      }
    } catch {
      return [data as T];
    }
  }
  return [data];
}

const ContentView: React.FC = () => {
  const [content, setContent] = useState<Content | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<number>(0);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (id) {
          const data = await getContentById(id);
          console.log('Raw reflections:', data.reflections);
          const processedReflections = ensureArray(data.reflections);
          console.log('Processed reflections:', processedReflections);
          setContent({
            ...data,
            reflections: processedReflections,
            drafts: ensureArray(data.drafts),
          });
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

  console.log('Content reflections:', content.reflections);

  return (
    <ContentContainer>
      <ContentHeader>{content.topic}</ContentHeader>
      <MetaInfo>
        Category: {content.category} | Type: {content.contentType}
      </MetaInfo>
      <MetaInfo>Created at: {new Date(content.createdAt).toLocaleString()}</MetaInfo>

      <ContentSection>
        <SectionTitle>Final Content</SectionTitle>
        <ContentText>{content.finalContent}</ContentText>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Research</SectionTitle>
        <ContentText>{content.research}</ContentText>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Reflections</SectionTitle>
        {content.reflections && content.reflections.length > 0 ? (
          content.reflections.map((reflection, index) => (
            <ReflectionItem key={index}>
              <p>
                <strong>Critique {index + 1}:</strong> {reflection.critique || 'No critique available'}
              </p>
              <p>
                Score: <ScoreSpan score={reflection.score || 0}>{reflection.score || 'N/A'}</ScoreSpan>/10
              </p>
            </ReflectionItem>
          ))
        ) : (
          <p>No reflections available</p>
        )}
      </ContentSection>

      <ContentSection>
        <SectionTitle>Drafts</SectionTitle>
        {content.drafts.length > 0 ? (
          <>
            <DraftSelector value={selectedDraft} onChange={e => setSelectedDraft(Number(e.target.value))}>
              {content.drafts.map((_, index) => (
                <option key={index} value={index}>
                  Draft {index + 1}
                </option>
              ))}
            </DraftSelector>
            <ContentText>{content.drafts[selectedDraft]}</ContentText>
          </>
        ) : (
          <p>No drafts available</p>
        )}
      </ContentSection>
    </ContentContainer>
  );
};

export default ContentView;
