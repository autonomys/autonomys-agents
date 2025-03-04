import React, { useRef, useEffect } from 'react';
import { OutputLogProps } from '../../types/types';
import './BodyStyles.css';

const OutputLog: React.FC<OutputLogProps> = ({ messages }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="output-log" ref={logRef}>
      {messages.map((message, index) => (
        <div key={index} className="log-message">
          {message}
        </div>
      ))}
    </div>
  );
};

export default OutputLog; 