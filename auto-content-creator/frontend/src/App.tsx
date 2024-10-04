import React from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ContentGenerator from './components/ContentGenerator';
import ContentList from './components/ContentList';
import ContentView from './components/ContentView';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Title = styled.h1`
  color: #333;
  text-align: center;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const NavLink = styled(Link)`
  margin: 0 10px;
  text-decoration: none;
  color: #007bff;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }
`;

const App: React.FC = () => {
  return (
    <Router>
      <AppContainer>
        <Title>Auto Content Creator</Title>
        <NavBar>
          <NavLink to='/'>Generate Content</NavLink>
          <NavLink to='/contents'>View Contents</NavLink>
        </NavBar>
        <Routes>
          <Route path='/' element={<ContentGenerator />} />
          <Route path='/contents' element={<ContentList />} />
          <Route path='/content/:id' element={<ContentView />} />
        </Routes>
      </AppContainer>
    </Router>
  );
};

export default App;
