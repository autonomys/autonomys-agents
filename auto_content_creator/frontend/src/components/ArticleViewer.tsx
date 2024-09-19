import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ArticleViewerProps {
  articleId: string;
}

interface Article {
  article_id: string;
  topic: string;
  article_content: string;
  fact_check_report: string;
  research_info: string;
  final_article_content: string;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ articleId }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/article/${articleId}`);
        setArticle(response.data);
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (isLoading) {
    return <div>Loading article...</div>;
  }

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div>
      <h2>Article: {article.topic}</h2>
      <h3>Final Content:</h3>
      <pre>{article.final_article_content}</pre>
      <h3>Fact Check Report:</h3>
      <pre>{article.fact_check_report}</pre>
      <h3>Research Info:</h3>
      <pre>{article.research_info}</pre>
    </div>
  );
};

export default ArticleViewer;
