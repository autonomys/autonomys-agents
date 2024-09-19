import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ArticleSummary {
  id: string;
  title: string;
  created_at: string;
}

interface ArticleListProps {
  onArticleSelect: (id: string) => void;
}

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
    <div>
      <h2>Existing Articles</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {articles.map(article => (
              <li key={article.id} onClick={() => onArticleSelect(article.id)}>
                {article.title} - Created on: {new Date(article.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
          <div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </button>
            <span>
              {' '}
              Page {page} of {totalPages}{' '}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ArticleList;
