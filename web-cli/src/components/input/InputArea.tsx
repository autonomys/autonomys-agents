import React, { KeyboardEvent } from 'react';
import StatusBox from '../status/StatusBox';
import '../styles/BodyStyles.css';
import { InputBoxProps } from '../../types/types';

const InputBox: React.FC<InputBoxProps> = ({ value, handleInputChange, handleInputSubmit }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  return (
    <div className='input-box'>
      <h3>Input</h3>
      <div className='input-container'>
        <textarea
          className='input-textarea'
          value={value}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Enter your message here...'
        />
        <button className='submit-button' onClick={handleInputSubmit}>
          Send
        </button>
      </div>
      <div className='input-tooltip'>Press Enter to send, Shift+Enter for new line</div>
    </div>
  );
};

const InputArea: React.FC<InputBoxProps> = ({
  value,
  handleInputChange,
  handleInputSubmit,
  currentTask,
  error,
}) => {
  const getStatusText = () => {
    if (currentTask) {
      const taskStatus = currentTask.status || 'processing';
      const formattedStatus = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1);
      return `${formattedStatus}: ${currentTask.description}`;
    } else if (error) {
      return `Error: ${error}`;
    } else {
      return 'Ready';
    }
  };

  return (
    <div className='body-left-section'>
      <StatusBox status={getStatusText()} />
      <InputBox
        value={value}
        handleInputChange={handleInputChange}
        handleInputSubmit={handleInputSubmit}
      />
    </div>
  );
};

export default InputArea;
