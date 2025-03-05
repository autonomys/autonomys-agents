import { useState, useEffect } from 'react';
import HeaderArea from './components/header/HeaderArea';
import OutputLog from './components/body/OutputLog';
import BodyArea from './components/body/BodyArea';
import { AppProvider } from './context/AppContext';
import './App.css';

function App() {
  const [messages] = useState<string[]>([
    'Welcome to Autonomys Agents Web CLI!',
    'Type your message in the input box below and press Enter to send.',
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        console.log('Ctrl+K pressed - would focus input');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AppProvider>
      <div className='App'>
        <HeaderArea />
        <OutputLog messages={messages} />
        <BodyArea />
      </div>
    </AppProvider>
  );
}

export default App;
