import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

interface ArticleSummary {
  id: string;
  title: string;
  created_at: string;
}

interface ArticleListProps {
  onArticleSelect: (id: string) => void;
}

const ListContainer = styled.div`
  background-color: #f5f5f5; // Muted background color
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ListTitle = styled.h2`
  color: #4a4a4a; // Muted text color
  margin-bottom: 20px;
`;

const ArticleItem = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  padding: 10px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const ArticleTitle = styled.span`
  font-weight: bold;
  color: #444;
`;

const ArticleDate = styled.span`
  font-size: 0.9em;
  color: #666;
  margin-left: 10px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
`;

const PaginationButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`;

const PageInfo = styled.span`
  color: #666;
`;

const ArticleList: React.FC<ArticleListProps> = ({ onArticleSelect }) => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/articles?page=${page}&page_size=10`);
      setArticles(response.data.articles);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
    setIsLoading(false);
  };

  return (
    <ListContainer>
      <ListTitle>Existing Articles</ListTitle>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {articles.map(article => (
              <ArticleItem key={article.id} to={`/article/${article.id}`}>
                <ArticleTitle>{article.title}</ArticleTitle>
                <ArticleDate>Created on: {new Date(article.created_at).toLocaleString()}</ArticleDate>
              </ArticleItem>
            ))}
          </ul>
          <PaginationContainer>
            <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </PaginationButton>
            <PageInfo>
              Page {page} of {totalPages}
            </PageInfo>
            <PaginationButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </PaginationButton>
          </PaginationContainer>
        </>
      )}
    </ListContainer>
  );
};

export default ArticleList;
