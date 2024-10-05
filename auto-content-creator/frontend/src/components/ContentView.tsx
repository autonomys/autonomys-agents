import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const MarkdownContent = styled(ReactMarkdown)`
  font-size: 0.9em;
  line-height: 1.2;
  white-space: pre-wrap;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  color: #333;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 0.5em;
    margin-bottom: 0.2em;
    line-height: 1.1;
  }

  h1 {
    font-size: 1.1em;
  }

  h2 {
    font-size: 1.05em;
  }

  h3,
  h4,
  h5,
  h6 {
    font-size: 1em;
  }

  p {
    margin-top: 0.2em;
    margin-bottom: 0.3em;
  }

  ul,
  ol {
    margin-top: 0.2em;
    margin-bottom: 0.3em;
    padding-left: 1.2em;
  }

  li {
    margin-bottom: 0.1em;
  }

  code {
    background-color: #f0f0f0;
    padding: 0.1em 0.2em;
    border-radius: 2px;
    font-size: 0.9em;
  }

  pre {
    background-color: #f0f0f0;
    padding: 0.4em;
    border-radius: 2px;
    overflow-x: auto;
    font-size: 0.9em;
    margin: 0.3em 0;
  }
`;

const CollapsibleSection = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 10px;
`;

const CollapsibleHeader = styled.div`
  background-color: #f0f0f0;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CollapsibleContent = styled.div<{ isOpen: boolean }>`
  padding: 10px;
  display: ${props => (props.isOpen ? 'block' : 'none')};
`;

const ToggleButton = styled.span`
  font-size: 1.2em;
`;

const CopyButton = styled.button`
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;

  &:hover {
    background-color: #0056b3;
  }
`;

const ContentView: React.FC = () => {
  const [content, setContent] = useState<Content | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<number>(0);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log('Copying to clipboard was successful!');
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  return (
    <ContentContainer>
      <ContentHeader>{content.topic}</ContentHeader>
      <MetaInfo>
        Category: {content.category} | Type: {content.contentType}
      </MetaInfo>
      <MetaInfo>Created at: {new Date(content.createdAt).toLocaleString()}</MetaInfo>

      <ContentSection>
        <SectionTitle>
          Final Content
          <CopyButton onClick={() => copyToClipboard(content.finalContent)}>Copy</CopyButton>
        </SectionTitle>
        <ContentText>{content.finalContent}</ContentText>
      </ContentSection>

      <CollapsibleSection>
        <CollapsibleHeader onClick={() => setIsResearchOpen(!isResearchOpen)}>
          <SectionTitle>Research</SectionTitle>
          <ToggleButton>{isResearchOpen ? '▲' : '▼'}</ToggleButton>
        </CollapsibleHeader>
        <CollapsibleContent isOpen={isResearchOpen}>
          <MarkdownContent>{content.research}</MarkdownContent>
        </CollapsibleContent>
      </CollapsibleSection>

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
