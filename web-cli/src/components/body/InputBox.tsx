import React, { KeyboardEvent } from 'react';
import { InputBoxProps } from '../../types/types';
import './styles/BodyStyles.css';

const InputBox: React.FC<InputBoxProps> = ({ value, onChange, onSubmit, disabled }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className='input-box'>
      <h3>Input {disabled && '(Processing...)'}</h3>
      <div className='input-container'>
        <textarea
          className='input-textarea'
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Enter your message here...'
        />
        <button className='submit-button' onClick={onSubmit} disabled={disabled || !value.trim()}>
          Send
        </button>
      </div>
      <div className='input-tooltip'>Press Enter to send, Shift+Enter for new line</div>
    </div>
  );
};

export default InputBox;
