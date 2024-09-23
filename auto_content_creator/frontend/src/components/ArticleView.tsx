import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import FeedbackForm from './FeedbackForm';

const ArticleContainer = styled.div`
  background-color: #f9f7f7;
  border-radius: 8px;
  padding: 20px;
  color: #333;
`;

const ArticleTitle = styled.h2`
  margin-bottom: 20px;
  color: #4a4a4a;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #4a4a4a;
`;

const ContentSection = styled.div`
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
`;

const DraftSelector = styled.select`
  margin-bottom: 20px;
  padding: 5px;
`;

interface ArticleData {
  id: string;
  title: string;
  content: string;
  fact_check_report: string;
  research_info: string;
  created_at: string;
}

interface DraftData {
  draft_number: number;
  content: string;
  feedback: string;
  created_at: string;
}

function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<number>(0);

  useEffect(() => {
    fetchArticle();
    fetchDrafts();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/article/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const fetchDrafts = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/article-drafts/${id}`);
      setDrafts(response.data);
      setSelectedDraft(response.data.length - 1); // Select the latest draft
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const handleDraftChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDraft(Number(event.target.value));
  };

  if (!article) return <p>Loading...</p>;

  const currentDraft = drafts[selectedDraft] || { content: article.content };

  return (
    <ArticleContainer>
      <ArticleTitle>{article.title}</ArticleTitle>
      <p>Created on: {new Date(article.created_at).toLocaleString()}</p>

      <DraftSelector value={selectedDraft} onChange={handleDraftChange}>
        {drafts.map((draft, index) => (
          <option key={index} value={index}>
            Draft {draft.draft_number}
          </option>
        ))}
      </DraftSelector>

      <SectionTitle>Article Content</SectionTitle>
      <ContentSection>
        <ReactMarkdown>{currentDraft.content}</ReactMarkdown>
      </ContentSection>

      <SectionTitle>Fact Check Report</SectionTitle>
      <ContentSection>
        <ReactMarkdown>{article.fact_check_report}</ReactMarkdown>
      </ContentSection>

      <SectionTitle>Research Information</SectionTitle>
      <ContentSection>
        <ReactMarkdown>{article.research_info}</ReactMarkdown>
      </ContentSection>

      <FeedbackForm articleId={id!} onFeedbackSubmitted={fetchDrafts} />
    </ArticleContainer>
  );
}

export default ArticleView;
