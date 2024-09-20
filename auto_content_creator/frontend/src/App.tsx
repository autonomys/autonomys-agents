import { useState } from 'react';
import styled from 'styled-components';
import ArticleGenerator from './components/ArticleGenerator';
import ArticleList from './components/ArticleList';
import ArticleView from './components/ArticleView';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #fafafa;
`;

const Title = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5em;
`;

const MainContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const HomeContainer = styled.div`
  text-align: center;
  color: #4a4a4a;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: center;
  background-color: #fff;
  padding: 15px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  margin: 0 15px;
  text-decoration: none;
  color: ${props => (props.$isActive ? '#007bff' : '#4a4a4a')};
  padding: 10px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: ${props => (props.$isActive ? 'bold' : 'normal')};

  &:hover {
    background-color: #f0f0f0;
    color: #007bff;
  }
`;

function NavLinkWithActive({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <NavLink to={to} $isActive={isActive}>
      {children}
    </NavLink>
  );
}

function App() {
  return (
    <Router>
      <AppContainer>
        <Title>Auto Content Creator</Title>
        <NavBar>
          <NavLinkWithActive to='/'>Home</NavLinkWithActive>
          <NavLinkWithActive to='/generate'>Generate Article</NavLinkWithActive>
          <NavLinkWithActive to='/articles'>Existing Articles</NavLinkWithActive>
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
