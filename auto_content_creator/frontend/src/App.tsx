import React from 'react';
import ArticleGenerator from './components/ArticleGenerator';

function App() {
  const handleArticleGenerated = (articleId: string) => {
    console.log('Article generated with ID:', articleId);
  };

  return (
    <div className='App'>
      <h1>Auto Content Creator</h1>
      <ArticleGenerator onArticleGenerated={handleArticleGenerated} />
    </div>
  );
}

export default App;
