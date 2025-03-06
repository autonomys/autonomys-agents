import React from 'react';
import StatusBox from '../StatusBox';
import InputBox from '../InputBox';
import '../styles/BodyStyles.css';

interface InputAreaProps {
  value: string;
  isProcessing: boolean;
  handleInputChange: (value: string) => void;
  handleInputSubmit: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  value,
  isProcessing,
  handleInputChange,
  handleInputSubmit,
}) => {
  return (
    <div className='body-left-section'>
      <StatusBox status={isProcessing ? 'Processing...' : 'Ready'} />
      <InputBox
        value={value}
        onChange={handleInputChange}
        onSubmit={handleInputSubmit}
        disabled={isProcessing}
      />
    </div>
  );
};

export default InputArea;
