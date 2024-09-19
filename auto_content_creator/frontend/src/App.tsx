import React, { useState } from 'react';
import ArticleGenerator from './components/ArticleGenerator';
import ArticleList from './components/ArticleList';

function App() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const handleArticleGenerated = (articleId: string) => {
    console.log('Article generated with ID:', articleId);
    setSelectedArticleId(articleId);
  };

  const handleArticleSelect = (articleId: string) => {
    setSelectedArticleId(articleId);
  };

  return (
    <div className='App'>
      <h1>Auto Content Creator</h1>
      <ArticleGenerator onArticleGenerated={handleArticleGenerated} />
      <ArticleList onArticleSelect={handleArticleSelect} />
      {selectedArticleId && <p>Selected Article ID: {selectedArticleId}</p>}
    </div>
  );
}

export default App;
