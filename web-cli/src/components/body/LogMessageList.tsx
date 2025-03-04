import React from 'react';
import { EventSourceMessage } from '../../types/types';
import './styles/LogMessageList.css';

interface LogMessageListProps {
  filteredMessages: EventSourceMessage[];
  legacyMessages?: string[];
  setLogRef: (ref: HTMLDivElement | null) => void;
}

const LogMessageList: React.FC<LogMessageListProps> = ({ 
  filteredMessages, 
  legacyMessages = [], 
  setLogRef 
}) => {
  return (
    <div className="output-log" ref={setLogRef}>
      {filteredMessages.length === 0 && legacyMessages.length === 0 && (
        <div className="welcome-message">
          Welcome to Autonomys Agents Web CLI
        </div>
      )}
      
      {/* Legacy messages (if any) */}
      {legacyMessages.map((message, index) => (
        <div key={index} className="log-message">
          {message}
        </div>
      ))}
      
      {/* Log messages from event source */}
      {filteredMessages.map((msg, index) => (
        <div key={`log-${index}`} className={`log-message log-${msg.level || 'info'}`}>
          <span className="log-timestamp">[{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}]</span>{' '}
          <span className="log-namespace">[{msg.namespace}]</span>{' '}
          <span className="log-level">[{msg.level || 'INFO'}]</span>{' '}
          <span className="log-content">{msg.message}</span>
          {msg.meta && Object.keys(msg.meta).length > 0 && (
            <div className="log-meta">
              <details>
                <summary>Meta Data</summary>
                <pre>{JSON.stringify(msg.meta, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LogMessageList; 