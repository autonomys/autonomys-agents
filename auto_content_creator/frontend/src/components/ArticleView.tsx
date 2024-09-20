import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

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

interface ArticleData {
  id: string;
  title: string;
  content: string;
  fact_check_report: string;
  research_info: string;
  created_at: string;
}

function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);

  useEffect(() => {
    axios
      .get(`http://localhost:8000/article/${id}`)
      .then(response => setArticle(response.data))
      .catch(error => console.error('Error fetching article:', error));
  }, [id]);

  if (!article) return <p>Loading...</p>;

  return (
    <ArticleContainer>
      <ArticleTitle>{article.title}</ArticleTitle>
      <p>Created on: {new Date(article.created_at).toLocaleString()}</p>

      <SectionTitle>Article Content</SectionTitle>
      <ContentSection>
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </ContentSection>

      <SectionTitle>Fact Check Report</SectionTitle>
      <ContentSection>
        <ReactMarkdown>{article.fact_check_report}</ReactMarkdown>
      </ContentSection>

      <SectionTitle>Research Information</SectionTitle>
      <ContentSection>
        <ReactMarkdown>{article.research_info}</ReactMarkdown>
      </ContentSection>
    </ArticleContainer>
  );
}

export default ArticleView;
