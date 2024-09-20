import { useState } from 'react';
import styled from 'styled-components';
import ArticleGenerator from './components/ArticleGenerator';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #fafafa; // Muted background color
`;

const Title = styled.h1`
  color: #4a4a4a; // Muted text color
  text-align: center;
  margin-bottom: 30px;
`;

const MainContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const HomeContainer = styled.div`
  text-align: center;
  color: #4a4a4a;
`;

// Define NavBar component
const NavBar = styled.nav`
  display: flex;
  justify-content: center;
  background-color: #e6e6e6;
  padding: 10px;
  margin-bottom: 20px;
`;

// Define NavLink component
const NavLink = styled(Link)`
  margin: 0 15px;
  text-decoration: none;
  color: #4a4a4a;
  padding: 8px 12px;
  border-radius: 4px;

  &:hover {
    background-color: #d4d4d4;
  }
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Title>Auto Content Creator</Title>
        <NavBar>
          <NavLink to='/'>Home</NavLink>
          <NavLink to='/generate'>Generate Article</NavLink>
          <NavLink to='/articles'>Existing Articles</NavLink>
        </NavBar>
        <MainContent>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/generate' element={<ArticleGenerator onArticleGenerated={() => {}} />} />
            <Route path='/articles' element={<ArticleList onArticleSelect={() => {}} />} />
            <Route path='/article/:id' element={<ArticleView />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </Router>
  );
}

function Home() {
  return (
    <HomeContainer>
      <h2>Welcome to the Auto Content Creator</h2>
      <p>Create and view articles effortlessly.</p>
    </HomeContainer>
  );
}

export default App;
