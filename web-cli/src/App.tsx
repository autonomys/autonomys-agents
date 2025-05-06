import { useState, useEffect } from 'react';
import HeaderArea from './components/header/HeaderArea';
import OutputLog from './components/logs/OutputLog';
import BodyArea from './components/BodyArea';
import { AppProvider } from './context/AppContext';
import { ChatProvider } from './context/ChatContext';
import { closeAll } from './services/LogService';
import './App.css';

function App() {
  const [messages] = useState<string[]>([
    'Welcome to the Autonomys Agents Web CLI',
    'Type your message in the input box on the top right and press Enter to send.',
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
      closeAll();
    };
  }, []);

  return (
    <AppProvider>
      <ChatProvider>
        <div className='App'>
          <HeaderArea />
          <div className='main-content-layout'>
            <OutputLog messages={messages} />
            <BodyArea />
          </div>
        </div>
      </ChatProvider>
    </AppProvider>
  );
}

export default App;
